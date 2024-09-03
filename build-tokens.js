const StyleDictionary = require("style-dictionary");

const { fileHeader, formattedVariables } = StyleDictionary.formatHelpers;

StyleDictionary.registerParser({
  name: "parser-foo",
  pattern: /\.json5$/,
  parse: ({ contents, filePath }) => {
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
  transforms: [...StyleDictionary.transformGroup.js, "name/cti/camel"],
});

StyleDictionary.registerTransform({
  name: "transform-foo",
  matcher: (token) => true,
  transformer: (token) => {
    return token.value;
  },
});

StyleDictionary.registerFormat({
  name: `myCustomFormat`,
  formatter: function ({ dictionary, file }) {
    const fh = fileHeader({ file });
    return `${fh}${dictionary.allTokens
      .map((token) => {
        let value = JSON.stringify(token.value);
        if (dictionary.usesReference(token.original.value)) {
          const refs = dictionary.getReferences(token.original.value);
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

const sd = StyleDictionary.extend({
  fileHeader: {
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
  transform: {
    "transform-bar": {
      matcher: (token) => true,
      transformer: (token) => {
        return token.value;
      },
    },
  },
  filter: {
    "register-filter": {
      filter: () => true,
    },
  },
  parsers: [
    {
      pattern: /\.json5$/,
      parse: ({ contents, filePath }) => {
        return JSON5.parse(contents);
      },
    },
  ],
  transformGroup: {
    foo: ["transform-bar"],
  },
  source: ["tokens/**/*.json"],
  log: "error",
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
          mapName: "tokens",
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

sd.buildAllPlatforms();
