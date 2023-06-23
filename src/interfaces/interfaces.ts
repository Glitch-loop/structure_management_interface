
export interface ICollaborator {
  id_collaborator?: number;
  first_name?: string;
  last_name?: string;
  street?: string;
  ext_number?: string;
  int_number?: string; //address
  cell_phone_number?: string;
  id_colony?: number;
  email?: string;
  password?: string;
  sessionToken?: string;
}

export interface IMember {
  id_member?: number;
  first_name?: string;
  last_name?: string;
  street?: string;
  ext_number?: string;
  int_number?: string; //address
  cell_phone_number?: string;
  id_leader?: number;
  id_follower?: number[];
  id_colony?: number;
  id_strategy?: number;
  colony_name?: string;
  postal_code?: string;
}

export interface IAssignPrivilege {
  id_collaborator?: number;
  id_privilege?: number;
  dateAssignation?: string;
}

export interface IPrivilege {
  id_privilege?: number;
  name_privilege?: string;
}

export interface IColony {
  id_colony: number;
  name_colony: string;
  postal_code: string;
}

export interface IStrategy {
  id_strategy: number;
  zone_type?: string;
  role: string;
  cardinality_level: number;
}

export interface IGeographicArea {
  id_geographic_area?: number;
  geographic_area_name?: string;
  id_geographic_area_belongs?: string;
  id_member?: number;
  id_strategy?: number;
}

export interface IGeographicAreaCoordinates {
  id_geographic_area_coordinates?: number;
  latitude?: number;
  longuitude?: number;
  id_geographic_area?: number;
}

export interface IRequest<T> {
  message: string;
  code: number;
  data?: T
}


export interface IStructure {
  id_member: number;
  first_name?: string;
  last_name?: string;

  id_strategy?: number;
  zone_type?: string;
  role?: string;
  cardinality_level?: number;

  id_leader?: number;
  first_name_leader?: string;
  last_name_leader?: string;

  followers?: IStructure[];

  id_geographic_area?: number;
  geographic_area_name?: string;


}