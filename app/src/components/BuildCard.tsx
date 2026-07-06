export type BuildSummary = {
  id: string;
  user_id: string;
  kit_name: string;
  grade: string;
  photo_url: string | null;
  score: number;
  created_at: string;
  builder_handle: string | null;
  like_count: number;
  comment_count: number;
};
