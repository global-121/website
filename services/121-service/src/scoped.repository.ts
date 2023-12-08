import { Request } from 'express';
import {
  DataSource,
  EntityMetadata,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { EntityTarget } from 'typeorm/common/EntityTarget';
import { RegistrationEntity } from './registration/registration.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import {
  FindOptionsCombined,
  convertToScopedOptions,
} from './utils/scope/createFindWhereOptions.helper';

export class ScopedQueryBuilder<T> extends SelectQueryBuilder<T> {
  constructor(query: SelectQueryBuilder<T>) {
    super(query);
    // Copy other properties if needed
  }
  // Would be better if there was a way to give an error before compile time
  where(_condition?: string, _parameters?: any): this {
    // The reason for this error is that you else overwrite the .where of the scoped repository
    throw new Error(
      'The .where method is not allowed for scope repositories. Use .andWhere instead.',
    );
  }
}

type EntityRelations = Record<string, string[]>;

// TODO: Is there a way to make these arrays strongly typed?
const relationConfig: EntityRelations = {
  IntersolveVisaWalletEntity: ['intersolveVisaCustomer', 'registration'],
  SafaricomRequestEntity: ['transaction', 'registration'],
  IntersolveVoucherEntity: ['image', 'registration'],
};

// TODO use this for any entity that needs to be scoped that related to registration
@Injectable({ scope: Scope.REQUEST, durable: true })
export class ScopedRepository<T> {
  private repository: Repository<T>;
  // public request: Request;

  // Use  for entities that have an INDIRECT relation to registration
  // Else the relation is found automatically in the constructor
  // DECIDE: Is it more confusing than not use this automatic detection? Is it better to always set it manually?
  // Another option is to try to set it automatically for all entities also those with an indrect relation
  // An example of this for IntersolveVisaWalletEntity is ['intersolveVisaCustomer',  'registration']
  public relationArrayToRegistration: string[];

  constructor(
    target: EntityTarget<T>,
    @InjectDataSource() dataSource: DataSource,
    @Inject(REQUEST) private request: Request,
  ) {
    // this.request
    this.repository = dataSource.createEntityManager().getRepository(target);

    if (relationConfig[this.repository.metadata.name]) {
      this.relationArrayToRegistration =
        relationConfig[this.repository.metadata.name];
    } else {
      this.relationArrayToRegistration = [
        this.findDirectRelationToRegistration(this.repository.metadata),
      ];
    }
  }

  private findDirectRelationToRegistration(metadata: EntityMetadata): string {
    // Gets the relations of the entity for which this repository is created
    const relations = metadata.relations.map(
      (relation) => relation.propertyName,
    );
    for (const relation of relations) {
      const relationType =
        metadata.findRelationWithPropertyPath(relation)?.type;
      if (relationType === RegistrationEntity) {
        return relation;
      }
    }
  }

  public async find(options: FindOptionsCombined<T>): Promise<T[]> {
    if (!this.request?.scope || this.request.scope === '') {
      return this.repository.find(options);
    }
    const scopedOptions = convertToScopedOptions<T>(
      options,
      this.relationArrayToRegistration,
      this.request.scope,
    );
    return this.repository.find(scopedOptions);
  }

  public async findOne(options: FindOptionsCombined<T>): Promise<T> {
    if (!this.request?.scope || this.request.scope === '') {
      return this.repository.findOne(options);
    }
    const scopedOptions = convertToScopedOptions<T>(
      options,
      this.relationArrayToRegistration,
      this.request.scope,
    );
    return this.repository.findOne(scopedOptions);
  }

  public createQueryBuilder(queryBuilderAlias: string): ScopedQueryBuilder<T> {
    let qb = this.repository.createQueryBuilder(queryBuilderAlias);

    if (!this.request?.scope || this.request.scope === '') {
      return new ScopedQueryBuilder(qb);
    }

    if (
      this.relationArrayToRegistration &&
      this.relationArrayToRegistration.length > 0
    ) {
      let joinProperty = queryBuilderAlias;
      for (const relation of this.relationArrayToRegistration) {
        const joinAlias = `scopedata${relation}`;
        qb = qb.leftJoin(`${joinProperty}.${relation}`, joinAlias);
        joinProperty = joinAlias;
      }
      qb = qb.leftJoin(`${joinProperty}.program`, 'scopedataprogramjoin');
      console.log('joinAlias: ', joinProperty);
      qb = qb.andWhere(
        `(scopedataprogramjoin."enableScope" = false OR ${joinProperty}.scope LIKE :scope)`,
        {
          scope: `${this.request.scope}%`,
        },
      );
    }
    return new ScopedQueryBuilder(qb);
  }
}
