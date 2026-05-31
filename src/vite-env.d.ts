/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly APP_URL: string;
  readonly VITE_ADMIN_AUTH_CONTINUE_URL?: string;
  readonly VITE_CLOUDINARY_CLOUD_NAME: string;
  readonly VITE_CLOUDINARY_UPLOAD_PRESET: string;
  readonly VITE_WHATSAPP_NUMBER: string;
  readonly VITE_INSTAGRAM_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
