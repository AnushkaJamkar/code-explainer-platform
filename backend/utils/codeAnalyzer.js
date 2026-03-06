const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

function analyzeJavaScript(code) {
  let ast;

  try {
    ast = parser.parse(code, {
      sourceType: "module",
      plugins: ["jsx"],
      errorRecovery: true
    });
  } catch (err) {
    return {
      metrics: {
        functionCount: 0,
        loopCount: 0,
        decisionCount: 0,
        cyclomaticComplexity: 1,
        maxNestingDepth: 0,
        maintainabilityScore: 100,
        riskLevel: "Low",
        timeComplexity: "O(1)"
      },
      smells: ["Code parsing failed. Please check syntax."],
      flowNodes: []
    };
  }

  let functionCount = 0;
  let loopCount = 0;
  let decisionCount = 0;
  let cyclomaticComplexity = 1;
  let maxNestingDepth = 0;
  let currentDepth = 0;

  let currentLoopDepth = 0;
  let maxLoopDepth = 0;

  const flowNodes = [];

  traverse(ast, {
    enter(path) {
      if (
        path.isIfStatement() ||
        path.isLoop() ||
        path.isSwitchStatement() ||
        path.isFunction()
      ) {
        currentDepth++;
        maxNestingDepth = Math.max(maxNestingDepth, currentDepth);
      }

      if (path.isFunctionDeclaration()) {
        functionCount++;
        flowNodes.push({
          type: "function",
          label: `Function: ${path.node.id?.name || "anonymous"}`
        });
      }

      if (
        path.isForStatement() ||
        path.isWhileStatement() ||
        path.isDoWhileStatement() ||
        path.isForInStatement() ||
        path.isForOfStatement()
      ) {
        loopCount++;
        decisionCount++;
        cyclomaticComplexity++;

        currentLoopDepth++;
        maxLoopDepth = Math.max(maxLoopDepth, currentLoopDepth);

        flowNodes.push({
          type: "loop",
          label: "Loop"
        });
      }

      if (path.isIfStatement()) {
        decisionCount++;
        cyclomaticComplexity++;

        const conditionCode = code.slice(path.node.test.start, path.node.test.end);

        flowNodes.push({
          type: "decision",
          label: `Condition: ${conditionCode}`
        });
      }

      if (path.isReturnStatement()) {
        flowNodes.push({
          type: "return",
          label: "Return"
        });
      }

      if (path.isSwitchCase() && path.node.test !== null) {
        decisionCount++;
        cyclomaticComplexity++;
      }

      if (path.isCatchClause()) {
        decisionCount++;
        cyclomaticComplexity++;
      }

      if (path.isConditionalExpression()) {
        decisionCount++;
        cyclomaticComplexity++;
      }

      if (
        path.isLogicalExpression() &&
        (path.node.operator === "&&" || path.node.operator === "||")
      ) {
        decisionCount++;
        cyclomaticComplexity++;
      }
    },

    exit(path) {
      if (
        path.isForStatement() ||
        path.isWhileStatement() ||
        path.isDoWhileStatement() ||
        path.isForInStatement() ||
        path.isForOfStatement()
      ) {
        currentLoopDepth--;
      }

      if (
        path.isIfStatement() ||
        path.isLoop() ||
        path.isSwitchStatement() ||
        path.isFunction()
      ) {
        currentDepth--;
      }
    }
  });

  let timeComplexity = "O(1)";
  if (maxLoopDepth === 1) {
    timeComplexity = "O(n)";
  } else if (maxLoopDepth > 1) {
    timeComplexity = `O(n^${maxLoopDepth})`;
  }

  let maintainabilityScore =
    100 -
    cyclomaticComplexity * 2 -
    maxNestingDepth * 3 -
    functionCount * 1.5;

  maintainabilityScore = Math.max(0, Math.round(maintainabilityScore));

  let riskLevel = "Low";
  if (maintainabilityScore < 50) riskLevel = "High";
  else if (maintainabilityScore < 80) riskLevel = "Moderate";

  return {
    metrics: {
      functionCount,
      loopCount,
      decisionCount,
      cyclomaticComplexity,
      maxNestingDepth,
      maintainabilityScore,
      riskLevel,
      timeComplexity
    },
    smells: [],
    flowNodes
  };
}

module.exports = { analyzeJavaScript };
