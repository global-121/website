export enum RegistrationStatusEnum {
  imported = 'imported',
  invited = 'invited',
  startedRegistration = 'startedRegistration',
  registered = 'registered',
  selectedForValidation = 'selectedForValidation',
  validated = 'validated',
  included = 'included',
  rejected = 'rejected',
  noLongerEligible = 'noLongerEligible',
  registeredWhileNoLongerEligible = 'registeredWhileNoLongerEligible',
  inclusionEnded = 'inclusionEnded',
  deleted = 'deleted',
  completed = 'completed',
  paused = 'paused',
  created = 'created',
}

export enum RegistrationStatusTimestampField {
  importedDate = 'importedDate',
  invitedDate = 'invitedDate',
  startedRegistrationDate = 'startedRegistrationDate',
  registeredWhileNoLongerEligibleDate = 'registeredWhileNoLongerEligibleDate',
  registeredDate = 'registeredDate',
  rejectionDate = 'rejectionDate',
  noLongerEligibleDate = 'noLongerEligibleDate',
  validationDate = 'validationDate',
  inclusionDate = 'inclusionDate',
  inclusionEndDate = 'inclusionEndDate',
  selectedForValidationDate = 'selectedForValidationDate',
  deleteDate = 'deleteDate',
  completedDate = 'completedDate',
  pausedDate = 'pausedDate',
}

export enum RegistrationStatusDateMap {
  imported = RegistrationStatusTimestampField.importedDate,
  invited = RegistrationStatusTimestampField.invitedDate,
  startedRegistration = RegistrationStatusTimestampField.startedRegistrationDate,
  registered = RegistrationStatusTimestampField.registeredDate,
  selectedForValidation = RegistrationStatusTimestampField.selectedForValidationDate,
  validated = RegistrationStatusTimestampField.validationDate,
  included = RegistrationStatusTimestampField.inclusionDate,
  rejected = RegistrationStatusTimestampField.rejectionDate,
  noLongerEligible = RegistrationStatusTimestampField.noLongerEligibleDate,
  registeredWhileNoLongerEligible = RegistrationStatusTimestampField.registeredWhileNoLongerEligibleDate,
  inclusionEnded = RegistrationStatusTimestampField.inclusionEndDate,
  deleted = RegistrationStatusTimestampField.deleteDate,
  completed = RegistrationStatusTimestampField.completedDate,
  paused = RegistrationStatusTimestampField.pausedDate,
}
