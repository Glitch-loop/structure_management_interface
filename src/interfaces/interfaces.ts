import { EAlert } from "./enums";

export interface IActivity {
  id_activity: number;
  name_activity: string;
  description_activity: string;
  expiration_date: string;
  creation_date: string;
  last_expiration_date?: string;
  members_done?: IActivityDone[];
}

export interface IActivityDone {
  id_activity_done: number;
  id_member: number;
  id_activity: number;
  performed_date: string;
}

export interface IAlert {
  alertType: EAlert;
  message?: string;
  dismissTime?: number;
}

export interface IApp {
  currentAlert?: IAlert;
  queueAlert: IAlert[];
}

export interface IAssignPrivilege {
  id_collaborator?: number;
  id_privilege?: number;
  dateAssignation?: string;
}

export interface ICollaborator {
  id_collaborator?: number;
  first_name?: string;
  last_name?: string;
  street?: string;
  ext_number?: string;
  int_number?: string; //address
  cell_phone_number?: string;
  id_colony?: number;
  colony_name?: string;
  postal_code?: string;
  email?: string;
  password?: string;
  privileges?: IPrivilege[];
}

export interface IColony {
  id_colony: number;
  name_colony: string;
  postal_code: string;
}

export interface IColor {
  target: number;
  spectrum1: number;
  spectrum2: number;
  spectrum3: number;
  opactity: number;
}

export interface IGeographicArea {
  id_geographic_area?: number;
  id_geographic_area_belongs?: number;
  geographic_area_name?: string;
  id_member?: number;
  id_strategy?: number;
  coordinates?: LatLng[];
  edtiable?: boolean;
}

export interface IGeographicAreaCoordinates {
  id_geographic_area_coordinates?: number;
  latitude?: number;
  longuitude?: number;
  id_geographic_area?: number;
}


export interface LatLng {
  lat: number,
  lng: number
}

export interface IMember {
  id_member?: number;
  first_name: string;
  last_name: string;
  street: string;
  ext_number: string;
  int_number: string; //address
  cell_phone_number: string;
  ine: string;
  birthday: string;
  gender: number;
  id_leader: number;
  id_follower: number[];
  id_colony: number;
  id_strategy: number;
  colony_name: string;
  postal_code: string;
  id_sectional: number;
  sectional_name: string;
}

export interface IPrivilege {
  id_privilege: number;
  name_privilege?: string;
  assigned?: boolean;
}

export interface IRequest<T> {
  message: string;
  code: number;
  data? : T
}

export interface ISectional {
  id_sectional: number;
  sectional_name: string;
  sectional_address?: string;
  target_members?: number;
  current_members?: number;
  coordinates?: LatLng[];
}

export interface IStructure {
  id_member: number;
  first_name?: string;
  last_name?: string;
  cell_phone_number?: string;
  ine?: string;

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

export interface IStrategy {
  id_strategy: number;
  zone_type: string;
  role: string;
  cardinality_level: number;
}

export interface IUser {
  idUser?: number;
  sessionToken?: string;
}

// Special Interfaces for GEOGRAPHIC AREAS
export interface IStrategyShow extends IStrategy {
  show?: boolean
}

export interface IOption {
  id: number;
  data: string;
}

export interface IZoneType {
  id: number;
  name: string;
}