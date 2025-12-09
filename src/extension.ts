import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { getAboutHtml } from "./about";

export function activate(context: vscode.ExtensionContext) {
  class XlfSidebarProvider implements vscode.TreeDataProvider<XlfSidebarItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<
      XlfSidebarItem | undefined | void
    > = new vscode.EventEmitter<XlfSidebarItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<
      XlfSidebarItem | undefined | void
    > = this._onDidChangeTreeData.event;

    getTreeItem(element: XlfSidebarItem): vscode.TreeItem {
      return element;
    }

    getChildren(element?: XlfSidebarItem): Thenable<XlfSidebarItem[]> {
      if (!element) {
        return Promise.resolve([
          new XlfSidebarItem("Select XLF File", {
            command: "nyarcode-xlf-editor.sidebar.open",
            title: "Open NyarCode XLF Editor",
          }),
          new XlfSidebarItem("About NyarCode XLF Editor", {
            command: "nyarcode-xlf-editor.sidebar.about",
            title: "About NyarCode XLF Editor",
          }),
        ]);
      }
      return Promise.resolve([]);
    }
  }

  class XlfSidebarItem extends vscode.TreeItem {
    constructor(label: string, command?: vscode.Command) {
      super(label);
      if (command) {
        this.command = command;
      }
    }
  }

  const disposable = vscode.commands.registerCommand(
    "nyarcode-xlf-editor.openXlfEditor",
    async (resource?: vscode.Uri) => {
      await openXlfEditor(resource);
    }
  );
  context.subscriptions.push(disposable);

  const viewDisposable = vscode.window.registerTreeDataProvider(
    "nyarcode-xlf-editor-sidebar-view",
    new XlfSidebarProvider()
  );
  context.subscriptions.push(viewDisposable);

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "nyarcode-xlf-editor.sidebar.open",
      async () => {
        await openXlfEditor(undefined);
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "nyarcode-xlf-editor.sidebar.about",
      async () => {
        const panel = vscode.window.createWebviewPanel(
          "nyarcodeXlfAbout",
          "About NyarCode XLF Editor",
          vscode.ViewColumn.One,
          {
            enableScripts: true,
            localResourceRoots: [
              vscode.Uri.file(path.join(context.extensionPath, "media")),
              vscode.Uri.file(path.join(context.extensionPath, "resources")),
            ],
          }
        );
        panel.webview.html = getAboutHtml(context, panel.webview);
      }
    )
  );

  async function openXlfEditor(resource?: vscode.Uri) {
    let xlfUri: vscode.Uri | undefined = resource;
    if (!xlfUri) {
      const uris = await vscode.window.showOpenDialog({
        filters: { "XLF Files": ["xlf", "xliff"] },
        canSelectMany: false,
      });
      if (!uris || uris.length === 0) {
        return;
      }
      xlfUri = uris[0];
    }
    const xlfContent = (await vscode.workspace.fs.readFile(xlfUri)).toString();

    const { pairs, sourceLanguage, targetLanguage } = parseXlf(xlfContent);

    const panel = vscode.window.createWebviewPanel(
      "nyarcodeXlfEditor",
      "NyarCode XLF Editor",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(context.extensionPath, "media")),
          vscode.Uri.file(path.join(context.extensionPath, "resources")),
        ],
      }
    );

    panel.webview.html = await getWebviewContent(
      context,
      panel,
      pairs,
      sourceLanguage,
      targetLanguage
    );

    panel.webview.onDidReceiveMessage(async (message) => {
      if (message.command === "saveTranslations") {
        const newPairs = message.pairs;
        const newXlf = updateXlfWithTranslations(xlfContent, newPairs);
        await vscode.workspace.fs.writeFile(
          xlfUri,
          Buffer.from(newXlf, "utf8")
        );
        vscode.window.showInformationMessage(
          "Translations saved to the XLF file."
        );
      }
    });
  }
}

async function getWebviewContent(
  context: vscode.ExtensionContext,
  panel: vscode.WebviewPanel,
  pairs: { source: string; target: string }[],
  sourceLanguage: string,
  targetLanguage: string
): Promise<string> {
  const rows = pairs
    .map(
      (pair, idx) =>
        `<tr><td class="row-number">${idx + 1}</td><td>${
          pair.source
        }</td><td><textarea data-idx="${idx}">${
          pair.target
        }</textarea></td></tr>`
    )
    .join("");
  const htmlPath = vscode.Uri.file(
    path.join(context.extensionPath, "media", "webview.html")
  );
  const cssPath = vscode.Uri.file(
    path.join(context.extensionPath, "media", "webview.css")
  );
  const logoPath = vscode.Uri.file(
    path.join(context.extensionPath, "resources", "logo.png")
  );
  const cssUri = panel.webview.asWebviewUri(cssPath);
  const logoUri = panel.webview.asWebviewUri(logoPath);
  let html = fs.readFileSync(htmlPath.fsPath, "utf8");
  html = html
    .replace("{{rows}}", rows)
    .replace("{{cssUri}}", cssUri.toString())
    .replace("{{logoUri}}", logoUri.toString())
    .replace("{{sourceLanguage}}", sourceLanguage)
    .replace("{{targetLanguage}}", targetLanguage);
  return html;
}

function updateXlfWithTranslations(
  xlf: string,
  pairs: { source: string; target: string }[]
): string {
  let idx = 0;
  return xlf.replace(
    /<trans-unit([\s\S]*?)<source[^>]*>([\s\S]*?)<\/source>([\s\S]*?)<target([^>]*?)(?:\/>|>([\s\S]*?)<\/target>)([\s\S]*?)<\/trans-unit>/g,
    (
      match,
      beforeSource,
      sourceContent,
      betweenSourceTarget,
      targetAttrs,
      targetContent,
      afterTarget
    ) => {
      const newTarget = pairs[idx] ? pairs[idx].target : "";
      idx++;
      let targetTag;
      if (newTarget === "") {
        targetTag = `<target${targetAttrs}/>`;
      } else {
        targetTag = `<target${targetAttrs}>${newTarget}</target>`;
      }
      return `<trans-unit${beforeSource}<source>${sourceContent}</source>${betweenSourceTarget}${targetTag}${afterTarget}</trans-unit>`;
    }
  );
}

function parseXlf(xlf: string): {
  pairs: { source: string; target: string }[];
  sourceLanguage: string;
  targetLanguage: string;
} {
  const fileMatch =
    xlf.match(
      /<file[^>]*source-language="([^"]+)"[^>]*target-language="([^"]+)"/
    ) ||
    xlf.match(
      /<file[^>]*target-language="([^"]+)"[^>]*source-language="([^"]+)"/
    );

  let sourceLanguage = "en";
  let targetLanguage = "es";

  if (fileMatch) {
    if (
      xlf.indexOf("source-language") <
      xlf.indexOf("target-language", xlf.indexOf("<file"))
    ) {
      sourceLanguage = fileMatch[1];
      targetLanguage = fileMatch[2];
    } else {
      targetLanguage = fileMatch[1];
      sourceLanguage = fileMatch[2];
    }
  }

  const regex =
    /<trans-unit[\s\S]*?<source[^>]*>([\s\S]*?)<\/source>[\s\S]*?<target([^>]*?)(?:\/>|>([\s\S]*?)<\/target>)[\s\S]*?<\/trans-unit>/g;
  const pairs: { source: string; target: string }[] = [];
  let match;
  while ((match = regex.exec(xlf)) !== null) {
    const source = match[1].trim();
    const target = match[3] !== undefined ? match[3].trim() : "";
    pairs.push({ source, target });
  }
  return { pairs, sourceLanguage, targetLanguage };
}
