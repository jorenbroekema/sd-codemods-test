import {
  fileHeader,
  formattedVariables,
  getReferences,
  usesReferences,
} from "style-dictionary/utils";
import StyleDictionary from "style-dictionary";

StyleDictionary.registerParser({
  name: "parser-foo",
  pattern: /\.json5$/,
  parser: ({ contents, filePath }) => {
    return JSON5.parse(contents);
  },
});

StyleDictionary.registerPreprocessor({
  name: "preprocessor-foo",
  preprocessor: (dictionary) => {
    // preprocess it
    return dictionary;
  },
});

StyleDictionary.registerTransformGroup({
  name: "js",
  transforms: [...StyleDictionary.transformGroup.js, "name/camel"],
});

StyleDictionary.registerTransform({
  name: "transform-foo",
  filter: (token) => true,
  transform: (token) => {
    return token.value;
  },
});

StyleDictionary.registerFormat({
  name: `myCustomFormat`,
  formatter: async function ({ dictionary, file }) {
    const fh = await fileHeader({ file });
    return `${fh}${dictionary.allTokens
      .map((token) => {
        let value = JSON.stringify(token.value);
        if (usesReferences(token.original.value)) {
          const refs = getReferences(token.original.value, dictionary.tokens);
          refs.forEach((ref) => {
            value = value.replace(ref.value, function () {
              return `${ref.name}`;
            });
          });
        }
        return `export const ${token.name} = ${value};`;
      })
      .join(`\n`)}`;
  },
});

const sd = new StyleDictionary({
  hooks: {
    fileHeaders: {
      foo: (defaultMessages = []) => [
        "Ola, planet!",
        ...defaultMessages,
        "Hello, World!",
      ],
    },
    preprocessors: {
      inlinefoo: (dictionary) => {
        // preprocess it
        return dictionary;
      },
    },
    transforms: {
      "transform-bar": {
        filter: (token) => true,
        transform: (token) => {
          return token.value;
        },
      },
    },
    filters: {
      "register-filter": {
        filter: () => true,
      },
    },
    parsers: {
      "json5-parser": {
        pattern: /\.json5$/,
        parser: ({ contents, filePath }) => {
          return JSON5.parse(contents);
        },
      },
    },
    transformGroups: {
      foo: ["transform-bar"],
    },
  },
  source: ["tokens/**/*.json"],
  log: {
    warnings: "error",
  },
  parsers: ["json5-parser"],
  preprocessor: ["inlinefoo"],
  platforms: {
    css: {
      transformGroup: "css",
      buildPath: "build/css/",
      files: [
        {
          options: {
            fileHeader: "foo",
          },
          destination: "_variables.css",
          format: "css/variables",
        },
        {
          destination: "map.scss",
          format: "scss/map-deep",
          options: {
            mapName: "tokens",
          },
        },
      ],
    },
    js: {
      transformGroup: "js",
      buildPath: "build/js/",
      files: [
        {
          destination: "vars.js",
          format: "myCustomFormat",
        },
      ],
    },
  },
});

await sd.buildAllPlatforms();
