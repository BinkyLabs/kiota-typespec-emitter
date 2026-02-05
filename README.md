# Kiota TypeSpec emitter

Welcome to the BinkyLabs Kiota TypeSpec emitter. This emitter allows you to generate client code for your APIs defined via TypeSpec using [kiota](https://aka.ms/kiota).

## Installation

### Global installation

```shell
npm i -g @binkylabs/kiota-typespec/emitter
```

### Local install

```shell
npm i -D @binkylabs/kiota-typespec/emitter
```

## Usage

In your **tspconfig.yaml** file, add the following section

```yaml
emit:
  - @binkylabs/kiota-typespec-emitter
options:
  "@binkylabs/kiota-typespec-emitter":
    clients:
      csharp:
        outputPath: "someOutputPath"
        clientClassName: "WidgetClient",
        clientNamespaceName: "DemoService.Client"
        #...
```

You MAY emit up to one client per definition per language. The options are the same as the [generate command](https://learn.microsoft.com/openapi/kiota/using#client-generation) (except for the OpenAPI description and the log level which are provided automatically). After generating the client code, you'll need to add the required dependencies [more information](https://learn.microsoft.com/openapi/kiota/quickstarts/).

> Important! This emitter downloads the kiota binaries (~40MB) upon first run, make sure you're connected to internet.
