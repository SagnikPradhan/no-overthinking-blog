import React from "react";
import { HashRouter, Switch, Route } from "react-router-dom";

const Home = React.lazy(() => import("./pages/home"));
const Blog = React.lazy(() => import("./pages/blog"));
const Editor = React.lazy(() => import("./pages/editor"));
const Dashboard = React.lazy(() => import("./pages/dashboard"));

const Loading = () => <h1>Loading...</h1>;

export const App = () => {
  return (
    <HashRouter>
      <main id="app">
        <React.Suspense fallback={<Loading />}>
          <Switch>
            <Route path="/editor">
              <Editor />
            </Route>
            <Route path="/dashboard">
              <Dashboard />
            </Route>

            <Route path="/blog/:id">
              <Blog />
            </Route>
            <Route path="/blog">
              <Blog />
            </Route>

            <Route path="/">
              <Home />
            </Route>
            <Route path="/home">
              <Home />
            </Route>
          </Switch>
        </React.Suspense>
      </main>
    </HashRouter>
  );
};
