import * as vscode from "vscode";
const { parse } = require("java-parser");

export class Metrics {
  public methods: any = [];
  public classes: any = [];
  public interfaces: any = [];
  public forLoops: any = [];
  public ifElseStatements: any = [];
  public whileLoops: any = [];
  public switchStatements: any = [];
  public doStatements: any = [];
  public initAndDeclStatements: any = [];
  public assignmentStatements: any = [];
  public blocks: any = [];
  public caseBlocks: any = [];

  public getBlocks = () => {
    const editor = vscode.window.activeTextEditor;
    const javaText = editor?.document.getText();
    const cst = parse(javaText);

    let q = [cst];
    let curl = 1;
    let nextl = 0;

    while (q.length > 0) {
      let s = q.shift();
      curl--;

      process.stdout.write(`${s.name},`);

      // if (s.location?.startLine === 95 && s.location?.endLine === 99) {
      //   console.log(`${s.name}`, s.location);
      // }

      if (s.name === "methodDeclaration") {
        this.methods.push(s.location);
      } else if (s.name === "classDeclaration") {
        this.classes.push(s.location);
      } else if (s.name === "forStatement") {
        this.forLoops.push(s.location);
      } else if (s.name === "ifStatement") {
        this.ifElseStatements.push(s.location);
      } else if (s.name === "whileStatement") {
        this.whileLoops.push(s.location);
      } else if (s.name === "switchStatement") {
        this.switchStatements.push(s.location);
      } else if (s.name === "doStatement") {
        this.doStatements.push(s.location);
      } else if (s.name === "interfaceDeclaration") {
        this.interfaces.push(s.location);
      } else if (s.name === "variableDeclarator") {
        this.initAndDeclStatements.push(s.location);
      } else if (s.name === "statementExpression") {
        this.assignmentStatements.push(s.location);
      } else if (s.name === "block") {
        this.blocks.push(s.location);
      } else if (s.name === "switchBlockStatementGroup") {
        this.caseBlocks.push(s.location);
      }

      if (s.children) {
        for (let [_, val] of Object.entries(s.children)) {
          if (Array.isArray(val)) {
            q = q.concat(val);
            nextl += val.length;
          } else {
            q.push(val);
            nextl++;
          }
        }
      }

      if (curl === 0) {
        curl = nextl;
        nextl = 0;
      }
    }

    // distinguishing between if, else if and else blocks
    var temp: any[] = [];
    var flag: boolean;

    for (let i = 0; i < this.blocks.length; i++) {
      flag = false;
      for (let j = 0; j < this.ifElseStatements.length; j++) {
        if (
          this.blocks[i].startLine >= this.ifElseStatements[j].startLine &&
          this.blocks[i].endLine <= this.ifElseStatements[j].endLine
        ) {
          flag = true;
          break;
        }
      }
      if (flag) {
        temp.push(this.blocks[i]);
      }
    }
    this.ifElseStatements = [];
    for (let i = 0; i < temp.length; i++) {
      this.ifElseStatements.push(temp[i]);
    }

    // distinguishing case blocks
    temp = [];

    for (let i = 0; i < this.caseBlocks.length; i++) {
      flag = false;
      for (let j = 0; j < this.switchStatements.length; j++) {
        if (
          this.caseBlocks[i].startLine >= this.ifElseStatements[j].startLine &&
          this.caseBlocks[i].endLine <= this.ifElseStatements[j].endLine
        ) {
          flag = true;
          break;
        }
      }
      if (flag) {
        temp.push(this.caseBlocks[i]);
      }
    }

    this.forLoops = this.removeNested(this.forLoops, this.forLoops);

    // console.log(this.switchStatements);
    // console.log(this.caseBlocks);
  };

  removeNested = (innerArray: any, outerArray: any) => {
    var temp: any[] = [];
    var flag: boolean;

    for (let i = 0; i < innerArray.length; i++) {
      flag = false;
      for (let j = 0; j < outerArray.length; j++) {
        if (
          (innerArray[i].startLine > outerArray[j].startLine &&
            innerArray[i].endLine < outerArray[j].endLine) ||
          (innerArray[i].startCharacter > outerArray[j].startCharacter &&
            innerArray[i].startLine === outerArray[j].startLine) ||
          (innerArray[i].endCharacter < outerArray[j].endCharacter &&
            innerArray[i].endLine === outerArray[j].endLine)
        ) {
          if (i !== j) {
            flag = true;
            break;
          }
        }
      }
      if (!flag) {
        temp.push(innerArray[i]);
      }
    }
    innerArray = [];
    for (let i = 0; i < temp.length; i++) {
      innerArray.push(temp[i]);
    }
    return innerArray;
  };
}