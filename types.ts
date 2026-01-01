
export enum ToolId {
  DASHBOARD = 'dashboard',
  PROJECTS = 'projects',
  // Text Tools
  FANCY_FONT = 'fancy-font',
  TEXT_REPEATER = 'text-repeater',
  CASE_CONVERTER = 'case-converter',
  AI_ENHANCER = 'ai-enhancer',
  WORD_COUNTER = 'word-counter',
  TAG_CHECKER = 'tag-checker',
  // Video Tools
  VIDEO_GENERATOR = 'video-generator',
  VIDEO_MOTION = 'video-motion',
  VIDEO_VFX = 'video-vfx',
  VIDEO_SCRIPT_GENERATOR = 'video-script-generator',
  // Image Tools
  IMAGE_UPSCALE = 'image-upscale',
  IMAGE_EDIT = 'image-edit',
  IMAGE_STORYBOARD = 'image-storyboard',
  // Audio Tools
  AUDIO_TTS = 'audio-tts',
  PODCAST_VOICE = 'podcast-voice',
}

export interface Tool {
  id: ToolId;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface FancyFontResult {
  name: string;
  text: string;
}

export interface Character {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
}

export interface StoryboardPanel {
  id: string;
  shotType: string;
  description: string;
  imageUrl: string;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  script: string;
  characters: Character[];
  storyboard: StoryboardPanel[];
}
