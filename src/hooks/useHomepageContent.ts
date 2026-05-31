import { useEffect, useState } from 'react';
import { DEFAULT_HOMEPAGE_CONTENT, getHomepageContent, HomepageContent } from '../services/homepageService';

export function useHomepageContent() {
  const [content, setContent] = useState<HomepageContent>(DEFAULT_HOMEPAGE_CONTENT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getHomepageContent()
      .then((next) => { if (active) setContent(next); })
      .catch((error) => console.error('Failed to load homepage content', error))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return { content, loading };
}
