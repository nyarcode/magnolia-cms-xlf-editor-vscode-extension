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
  const packageJsonPath = path.join(context.extensionPath, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const version = packageJson.version || "0.0.0";

  const cssUri = webview.asWebviewUri(cssPath);
  const logoUri = webview.asWebviewUri(logoPath);

  let html = fs.readFileSync(htmlPath.fsPath, "utf8");
  html = html
    .replace(/\{\{cssUri\}\}/g, cssUri.toString())
    .replace(/\{\{logoUri\}\}/g, logoUri.toString())
    .replace(/\{\{version\}\}/g, version);

  return html;
}
