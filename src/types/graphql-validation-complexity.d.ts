declare module "graphql-validation-complexity" {
  import { ValidationRule } from "graphql";

  export interface ComplexityRuleOptions {
    onCost?: (cost: number) => void;
    formatErrorMessage?: (cost: number) => string;
    createError?: (max: number, actual: number) => Error;
    estimators?: any[];
  }

  export function createComplexityLimitRule(
    maxComplexity: number,
    options?: ComplexityRuleOptions,
  ): ValidationRule;
}
