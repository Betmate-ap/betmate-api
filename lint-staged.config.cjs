// lint-staged.config.cjs
module.exports = {
  "*.{ts,tsx,js,cjs,mjs,json,md,mdx,yml,yaml,graphql}": ["prettier --write"],
  "*.{ts,tsx,js,cjs,mjs}": ["eslint --fix"],
};
