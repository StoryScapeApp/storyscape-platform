export interface ProfessorIdentity {
  id: string;
  email: string;
}

export interface AuthenticatedRequest {
  headers: { cookie?: string };
  professor?: ProfessorIdentity;
}
