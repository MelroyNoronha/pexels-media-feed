export enum MediaType {
  Photo = 'Photo',
  Video = 'Video',
};

export interface MediaItemBase {
  id: number;
  width: number;
  height: number;
  url: string;
  type: MediaType;
  user: {
    name: string;
    url: string;
  };
}

export interface Photo extends MediaItemBase {
  type: MediaType.Photo;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
}

export type VideoQuality =  "hd" | "sd" | "default";

export interface VideoFile {
  id: number;
  quality: VideoQuality;
  file_type: string;
  width: number;
  height: number;
  link: string;
}

export interface Video extends MediaItemBase {
  type: MediaType.Video;
  video_files: VideoFile[];
  video_pictures: Array<{
    id: number;
    picture: string;
    nr: number;
  }>;
}

export type MediaItem = Photo | Video;

export interface CollectionResponse {
  page: number;
  per_page: number;
  total_results: number;
  media: MediaItem[];
  next_page?: string;
  prev_page?: string;
}
