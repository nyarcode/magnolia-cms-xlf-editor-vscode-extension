import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

export function getAboutHtml(
  context: vscode.ExtensionContext,
  webview: vscode.Webview
): string {
  const htmlPath = vscode.Uri.file(
    path.join(context.extensionPath, "media", "about.html")
  );
  const cssPath = vscode.Uri.file(
    path.join(context.extensionPath, "media", "about.css")
  );
  const logoPath = vscode.Uri.file(
    path.join(context.extensionPath, "resources", "logo.png")
  );

  const cssUri = webview.asWebviewUri(cssPath);
  const logoUri = webview.asWebviewUri(logoPath);

  let html = fs.readFileSync(htmlPath.fsPath, "utf8");
  html = html
    .replace("{{cssUri}}", cssUri.toString())
    .replace("{{logoUri}}", logoUri.toString());

  return html;
}
