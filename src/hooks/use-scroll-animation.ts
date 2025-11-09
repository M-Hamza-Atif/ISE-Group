import { useEffect } from 'react';

export const useScrollAnimation = () => {
  useEffect(() => {
    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px',
    });

    // Small delay to let the DOM settle
    setTimeout(() => {
      const elements = document.querySelectorAll(
        '.scroll-reveal, .scroll-fade-in, .scroll-slide-left, .scroll-slide-right'
      );

      elements.forEach((el) => {
        // Check if element is already in viewport
        const rect = el.getBoundingClientRect();
        const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
        
        if (isInViewport) {
          el.classList.add('active');
        }
        
        observer.observe(el);
      });
    }, 100);

    return () => {
      observer.disconnect();
    };
  }, []);
};
