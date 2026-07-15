const quote = (file) => `'${file.replaceAll("'", "'\\''")}'`;

const eslintWorkspace = (workspace) => (files) =>
  `pnpm --filter ${workspace} exec eslint --fix ${files.map(quote).join(' ')}`;

const eslintPackages = (files) => `pnpm exec eslint --fix ${files.map(quote).join(' ')}`;

export default {
  'apps/web/**/*.{js,jsx,ts,tsx}': eslintWorkspace('web'),
  'apps/mobile/**/*.{js,jsx,ts,tsx}': eslintWorkspace('mobile'),
  'packages/**/*.{js,jsx,ts,tsx}': eslintPackages,
  'apps/api/**/*.py': [
    'uv run --directory apps/api ruff check --fix',
    'uv run --directory apps/api ruff format',
  ],
  '*.{js,cjs,mjs,ts,tsx,json,yaml,yml,css}': 'prettier --write',
};
