const BASE_URL = "https://api.github.com/";
const CONTENTS_URL = "repos/no-name-blog/blog-posts/contents/posts";
const COMMITS_URL = (post: string) =>
  "repos/no-name-blog/blog-posts/commits?path=posts/" + post;

/**
 * App Error
 */
export class AppError extends Error {
  public readonly context: Record<string, unknown>;

  constructor(name: string, context: Record<string, unknown>) {
    super(name);

    const stack = this.stack;

    Object.setPrototypeOf(this, new.target.prototype);

    this.name = name;
    this.context = context;

    // @ts-expect-error
    if (Error.captureStackTrace) Error.captureStackTrace(this);
    else this.stack = stack;
  }
}

/**
 * Get list of posts
 */
export async function getPosts() {
  type GithubContentEndpointType = { name: string; download_url: string };

  const response = await githubRequest<
    Record<number, GithubContentEndpointType>
  >(CONTENTS_URL, (data) => typeof data === "object");

  // Removes extension from name
  return Object.values(response).map((p) => ({
    ...p,
    name: p.name.slice(0, -3),
  }));
}

/**
 * Get a post
 * @param post - Post
 */
export async function getPost(post: string) {
  const download_url = `https://raw.githubusercontent.com/no-name-blog/blog-posts/master/posts/${post}.md`;
  const request = await fetch(download_url);
  if (!request.ok) throw new AppError("Invalid Status Recieved", { request });

  const response = await request.text();
  const metaData = await getPostMetaData(post);

  return {
    name: post,
    ...metaData,
    content: response,
  };
}

/**
 * Get post meta data
 * @param post - Post file name
 */
async function getPostMetaData(post: string) {
  type GithubCommitsEndpointType = Record<
    number,
    {
      author: { login: string; url: string; avatar_url: string };
      commit: { author: { date: string } };
    }
  >;

  const response = await githubRequest<GithubCommitsEndpointType>(
    COMMITS_URL(post + ".md"),
    (data) => typeof data === "object"
  );

  return {
    authors: Object.fromEntries(
      Object.values(response).map(({ author }) => [author.login, author])
    ),
    updatedOn: new Date(Date.parse(response[0].commit.author.date)),
  };
}

const GithubRequestFnCache = new Map<string, unknown>();

/**
 * Make request to Github API
 * @param endpoint - Github Endpoint
 * @param validator - Validator Function
 */
async function githubRequest<T>(
  endpoint: string,
  validator: (data: unknown) => boolean
): Promise<T> {
  let data = GithubRequestFnCache.get(endpoint);

  // If not already cached
  if (!data) {
    const request = await fetch(BASE_URL + endpoint);
    if (!request.ok)
      throw new AppError("Invalid Status Code Recieved", { request });
    data = request.json();
    GithubRequestFnCache.set(endpoint, data);
  }

  // Validate data
  if (validator(data)) return data as T;
  else throw new AppError("Invalid Body Recieved", { data });
}
