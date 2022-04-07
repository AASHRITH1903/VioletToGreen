import * as vscode from "vscode";
const fs = require("fs");
const path = require("path");
import { SidebarSelectionProvider } from "./SidebarSelectionProvider";
import { SidebarReadabilityProvider } from "./SidebarReadabilityProvider";
import { SidebarLinksProvider } from "./SidebarLinksProvider";
import { runHeuristics } from "./heuristics";

const createFile = () => {
  var workspace = vscode.workspace?.workspaceFolders;
  if (workspace === null || workspace === undefined) {
    vscode.window.showErrorMessage("No workspace found");
    return false;
  }
  var filepath = path.join(
    workspace[0].uri.fsPath,
    "violettogreen.config.json"
  );
  fs.open(filepath, "r", (fileNotExists: Boolean, file: any) => {
    if (fileNotExists) {
      fs.writeFile(filepath, JSON.stringify([]), (err: any) => {
        if (err) {
          vscode.window.showErrorMessage(err);
          return false;
        }
      });
    }
  });
  return true;
};

function updateDiagnostics(
  document: vscode.TextDocument,
  collection: vscode.DiagnosticCollection
): void {
  if (document) {
    collection.set(document.uri, [
      {
        code: "",
        message: "This is a test for displaying diagnostic messages",
        range: new vscode.Range(
          new vscode.Position(3, 4),
          new vscode.Position(3, 10)
        ),
        severity: vscode.DiagnosticSeverity.Information,
        source: "",
        relatedInformation: [
          new vscode.DiagnosticRelatedInformation(
            new vscode.Location(
              document.uri,
              new vscode.Range(
                new vscode.Position(1, 8),
                new vscode.Position(1, 9)
              )
            ),
            "Additional information about the diagnostic"
          ),
        ],
      },
    ]);
  } else {
    collection.clear();
  }
}

export function activate(context: vscode.ExtensionContext) {
  if (!createFile()) {
    return;
  }

  const decoration = vscode.window.createTextEditorDecorationType({
    gutterIconPath: vscode.Uri.joinPath(
      context.extensionUri,
      "media",
      "checklist.svg"
    ).path,
  });

  const editor = vscode.window.activeTextEditor;

  editor?.setDecorations(decoration, [
    new vscode.Range(new vscode.Position(1, 1), new vscode.Position(2, 4)),
  ]);

  const collection = vscode.languages.createDiagnosticCollection("test");
  if (vscode.window.activeTextEditor) {
    updateDiagnostics(vscode.window.activeTextEditor.document, collection);
  }
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        updateDiagnostics(editor.document, collection);
      }
    })
  );

  const sidebarLinksProvider = new SidebarLinksProvider(context.extensionUri);
  const sidebarSelectionProvider = new SidebarSelectionProvider(
    context.extensionUri,
    sidebarLinksProvider
  );
  const sidebarReadabilityProvider = new SidebarReadabilityProvider(
    context.extensionUri
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "violet-to-green-selection",
      sidebarSelectionProvider
    )
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "violet-to-green-readability",
      sidebarReadabilityProvider
    )
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "violet-to-green-links",
      sidebarLinksProvider
    )
  );

  vscode.commands.executeCommand(
    "workbench.view.extension.violet-to-green-sidebar-view"
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("violet-to-green.helloWorld", () => {
      vscode.window.showInformationMessage("Hello World from VioletToGreen!");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("violet-to-green.refresh", async () => {
      await vscode.commands.executeCommand("workbench.action.closeSidebar");
      await vscode.commands.executeCommand(
        "workbench.view.extension.violet-to-green-sidebar-view"
      );
    })
  );

  vscode.commands.registerCommand("violet-to-green.linkAutomatically", () => {
    const editor = vscode.window.activeTextEditor;
    // const javaText = editor?.document.getText();
    const filesPath = path.resolve(
      __dirname,
      "..",
      "Dataset",
      "RealWorldData",
      "CodeFiles"
    );
    const outputPath = path.join(
      __dirname,
      "..",
      "Dataset",
      "RealWorldData",
      "Predictions"
    );
    // var filesLimit = 1;
    var predictions: string;

    fs.readdirSync(filesPath).forEach(function (filename: string) {
      fs.readFile(
        path.join(filesPath, filename),
        "utf-8",
        function (err: any, content: any) {
          if (err) {
            vscode.window.showErrorMessage(err);
            return;
          }
          predictions = runHeuristics(content);
          fs.writeFile(
            path.join(outputPath, filename.split(".")[0] + ".txt"),
            predictions,
            (err: any) => {
              vscode.window.showErrorMessage(err);
            }
          );
        }
      );
    });
    // runHeuristics(javaText!);
    // console.log(runHeuristics(javaText!));
  });
}

export function deactivate() {}
