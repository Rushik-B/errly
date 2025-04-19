    // packages/sdk/rollup.config.mjs
    import typescript from '@rollup/plugin-typescript';

    export default {
      input: 'src/index.ts', // Entry point
      output: [
        {
          file: 'dist/index.mjs', // Output for ES Modules
          format: 'es',
          sourcemap: true,
        },
        {
          file: 'dist/index.cjs', // Output for CommonJS
          format: 'cjs',
          sourcemap: true,
        },
      ],
      plugins: [
        typescript({
          tsconfig: './tsconfig.json', // Optional: Specify if you have a tsconfig
          // If you don't have a tsconfig.json yet, the plugin will use default settings
          // Or you can create a basic tsconfig.json in packages/sdk:
          // {
          //   "compilerOptions": {
          //     "target": "ES2017",
          //     "module": "ESNext",
          //     "declaration": true,
          //     "outDir": "./dist",
          //     "strict": true,
          //     "esModuleInterop": true,
          //     "skipLibCheck": true,
          //     "forceConsistentCasingInFileNames": true,
          //     "moduleResolution": "node" // Or "bundler" if using newer TS/Node versions
          //   },
          //   "include": ["src/**/*"],
          //   "exclude": ["node_modules", "dist"]
          // }
        }),
      ],
      external: ['undici'] // undici is a peer dependency, don't bundle it
    };