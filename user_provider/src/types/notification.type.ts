export interface PushPayload {
  tittle: string;
  message: string;
  deviceToken: string;
  status?: string;
  type?: string;
  data?: string;
}
