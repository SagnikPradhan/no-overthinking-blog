import { IRouter, Router } from "express";
import { FC, ComponentClass, createElement } from "react";
import ReactDOM from "react-dom/server";

const template = (preRenderedMarkup: string) => {
  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Document</title>
    </head>
    <body>
      <div id="app">${preRenderedMarkup}</div>
    </body>
  </html>
  `;
};

async function renderComponent(path: string): Promise<IRouter> {
  const router = Router();

  const Component: FC | ComponentClass = (await import(path)).default;
  const preRenderedMarkup = ReactDOM.renderToString(createElement(Component));
  const html = template(preRenderedMarkup);

  return router;
}
