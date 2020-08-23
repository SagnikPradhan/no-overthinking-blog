import React from 'react'
import { useParams } from 'react-router-dom'

// @ts-expect-error
import snarkdown from 'snarkdown'

import { getPost } from '../utils'

const Post = () => {
  const { id }: { id: string } = useParams()

  const [post, setPost] = React.useState('')

  getPost(id).then(v => {
    setPost(v.content)
  })

  return <div id="post" dangerouslySetInnerHTML={{ __html: snarkdown(post) }}></div>
}

export default Post