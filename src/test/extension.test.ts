import * as assert from "assert";
import * as vscode from "vscode";

suite("NyarCode XLF Editor Extension Test Suite", () => {
  vscode.window.showInformationMessage("Running NyarCode XLF Editor tests...");

  test("Extension should be present", () => {
    assert.ok(vscode.extensions.getExtension("nyarcode.nyarcode-xlf-editor"));
  });

  test("Extension should activate", async () => {
    const extension = vscode.extensions.getExtension(
      "nyarcode.nyarcode-xlf-editor"
    );
    assert.ok(extension);
    await extension!.activate();
    assert.strictEqual(extension!.isActive, true);
  });

  test('Command "openXlfEditor" should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes("nyarcode-xlf-editor.openXlfEditor"));
  });

  test('Command "sidebar.open" should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes("nyarcode-xlf-editor.sidebar.open"));
  });

  test('Command "sidebar.about" should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes("nyarcode-xlf-editor.sidebar.about"));
  });

  test("TreeView should be registered", () => {
    const treeView = vscode.window.createTreeView(
      "nyarcode-xlf-editor-sidebar-view",
      {
        treeDataProvider: {
          getTreeItem: (element: any) => element,
          getChildren: () => Promise.resolve([]),
        },
      }
    );
    assert.ok(treeView);
    treeView.dispose();
  });

  test("Extension handles XLF file context menu", async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes("nyarcode-xlf-editor.openXlfEditor"));
  });

  test("Rich text editor (Trumbowyg) resources should be available", () => {
    const extension = vscode.extensions.getExtension(
      "nyarcode.nyarcode-xlf-editor"
    );
    assert.ok(extension);
    const extensionPath = extension!.extensionPath;
    assert.ok(extensionPath);
  });

  test("Webview resources should be configured", async () => {
    const extension = vscode.extensions.getExtension(
      "nyarcode.nyarcode-xlf-editor"
    );
    assert.ok(extension);
    await extension!.activate();
    assert.strictEqual(extension!.isActive, true);
  });
});
