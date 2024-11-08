import { FoundProgramDto } from '@121-service/src/programs/dto/found-program.dto';
import { Attribute as AttributeFromBackend } from '@121-service/src/registration/enum/custom-data-attributes';
import { GetUserReponseDto } from '@121-service/src/user/dto/get-user-response.dto';
import { AssignmentResponseDTO } from '@121-service/src/user/dto/userrole-response.dto';

import { Dto } from '~/utils/dto-type';

export type Project = Dto<FoundProgramDto>;

export type ProjectUser = Dto<GetUserReponseDto>;

export type ProjectUserAssignment = Dto<AssignmentResponseDTO>;

export type ProjectUserWithRolesLabel = {
  allRolesLabel: string;
  lastLogin?: Date;
} & Omit<ProjectUser, 'lastLogin'>;

export type Attribute = Dto<AttributeFromBackend>;

export type AttributeWithTranslatedLabel = { label: string } & Omit<
  Attribute,
  'label'
>;
