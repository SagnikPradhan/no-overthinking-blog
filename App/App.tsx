import React from 'react'
import { HashRouter, Switch, Route } from 'react-router-dom'

const Home = React.lazy(() => import('./pages/home'))
const Post = React.lazy(() => import('./pages/post'))

const Loading = () => <h1>Loading...</h1>

export const App = () => {
  return <HashRouter>

    <div className="route">
      <React.Suspense fallback={<Loading />}>
        <Switch>
          <Route path='/blog/:id' ><Post /></Route>
          <Route path="/"><Home /></Route>
        </Switch>
      </React.Suspense>
    </div>

  </HashRouter>
}
