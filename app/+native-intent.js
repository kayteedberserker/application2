// app/+native-intent.js

export function redirectSystemPath({ path }) {
  // If the path is just the scheme (oreblogda://) or empty
  // we redirect it to the root "/" to prevent the Unmatched Route error.
  if (!path || path === 'oreblogda://' || path === 'oreblogda:///') {
    return '/';
  }

  // Otherwise, let the app navigate to the deep-linked path (like a specific post)
  return path;
}
