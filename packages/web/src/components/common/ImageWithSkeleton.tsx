import { useState } from "react";

interface Props {
  src: string;
  alt: string;
  className?: string;
}

export function ImageWithSkeleton({ src, alt, className = "" }: Props) {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {!loaded && (
        <div className={`animate-pulse bg-page-bg ${className}`} />
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${loaded ? "" : "hidden"}`}
        onLoad={() => setLoaded(true)}
      />
    </>
  );
}
