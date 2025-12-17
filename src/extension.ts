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
          vscode.Uri.file(
            path.join(context.extensionPath, "media", "trumbowyg", "ui")
          ),
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

        const updatedXlfContent = (
          await vscode.workspace.fs.readFile(xlfUri)
        ).toString();
        const updatedData = parseXlf(updatedXlfContent);

        panel.webview.html = await getWebviewContent(
          context,
          panel,
          updatedData.pairs,
          updatedData.sourceLanguage,
          updatedData.targetLanguage
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
  const trumbowygCssPath = vscode.Uri.file(
    path.join(
      context.extensionPath,
      "media",
      "trumbowyg",
      "ui",
      "trumbowyg.min.css"
    )
  );
  let trumbowygCss = fs.readFileSync(trumbowygCssPath.fsPath, "utf8");
  const iconsUri = panel.webview.asWebviewUri(
    vscode.Uri.file(
      path.join(context.extensionPath, "media", "trumbowyg", "ui", "icons.svg")
    )
  );
  trumbowygCss = trumbowygCss.replace(
    /url\(['"]?icons\.svg/g,
    `url('${iconsUri.toString()}`
  );
  const jqueryJsPath = vscode.Uri.file(
    path.join(context.extensionPath, "media", "trumbowyg", "jquery.min.js")
  );
  const jqueryJsUri = panel.webview.asWebviewUri(jqueryJsPath);
  function hasHtmlTags(text: string): boolean {
    if (!text) {
      return false;
    }
    function decodeHtmlEntities(str: string): string {
      return str
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&");
    }
    const trimmed = text.trim();
    const htmlRegex = /<([a-z][\w0-9]*)(\s[^>]*)?>[\s\S]*?<\/\1>/i;
    return (
      htmlRegex.test(trimmed) || htmlRegex.test(decodeHtmlEntities(trimmed))
    );
  }
  function escapeHtml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  const rows = pairs
    .map((pair, idx) => {
      const isHtml = hasHtmlTags(pair.source);
      let originalCell, translationCell;

      if (isHtml) {
        originalCell = `<textarea class="trumbowyg-editor-readonly" data-idx="${idx}" readonly>${pair.source}</textarea>`;
        translationCell = `<textarea class="trumbowyg-editor" data-idx="${idx}">${
          pair.target || ""
        }</textarea>`;
      } else {
        originalCell = `<textarea class="readonly-textarea" data-idx="${idx}" readonly>${escapeHtml(
          pair.source
        )}</textarea>`;
        translationCell = `<textarea data-idx="${idx}">${escapeHtml(
          pair.target || ""
        )}</textarea>`;
      }

      return `<tr><td class="row-number">${
        idx + 1
      }</td><td>${originalCell}</td><td>${translationCell}</td></tr>`;
    })
    .join("");
  const trumbowygJsPath = vscode.Uri.file(
    path.join(context.extensionPath, "media", "trumbowyg", "trumbowyg.min.js")
  );
  const trumbowygJsUri = panel.webview.asWebviewUri(trumbowygJsPath);
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
    .replace("{{jqueryJsUri}}", jqueryJsUri.toString())
    .replace("{{trumbowygJsUri}}", trumbowygJsUri.toString())
    .replace("{{trumbowygCss}}", `<style>${trumbowygCss}</style>`)
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
