#!/usr/bin/env node
/**
 * Pre-commit: .cursor/rules/components.mdc must have alwaysApply: true
 */
import { readFileSync } from "fs";

const path = ".cursor/rules/components.mdc";
const content = readFileSync(path, "utf8");

if (!/alwaysApply:\s*true\b/.test(content)) {
  console.error(`${path}: alwaysApply must be true (pre-commit check).`);
  process.exit(1);
}
