import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere } from 'typeorm';

import { EventSearchOptionsDto } from '@121-service/src/events/dto/event-search-options.dto';
import { EventEntity } from '@121-service/src/events/entities/event.entity';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';

export class EventScopedRepository extends ScopedRepository<EventEntity> {
  constructor(
    @Inject(REQUEST) request: ScopedUserRequest,
    @InjectRepository(EventEntity)
    scopedRepository: ScopedRepository<EventEntity>,
  ) {
    super(request, scopedRepository);
  }

  async getManyByProgramIdAndSearchOptions(
    programId: number,
    searchOptions: EventSearchOptionsDto,
  ) {
    const exportLimit = 500000;
    const events = await this.find({
      where: this.createWhereClause(programId, searchOptions),
      // TODO: How to reflect these relations in the return type
      relations: ['registration', 'user', 'attributes'],
      order: { created: 'DESC' },
      take: exportLimit,
    });
    return events;
  }

  private createWhereClause(
    programId: number,
    searchOptions: EventSearchOptionsDto,
  ): FindOptionsWhere<EventEntity> {
    const { registrationId, queryParams } = searchOptions;

    const whereStatement: FindOptionsWhere<EventEntity> & {
      registration: {
        programId: number;
        id?: number;
        referenceId?: string;
      };
    } = {
      registration: {
        programId,
      },
    };

    if (registrationId) {
      whereStatement.registration.id = registrationId;
    }
    if (queryParams) {
      if (queryParams['referenceId']) {
        whereStatement.registration.referenceId = queryParams['referenceId'];
      }

      whereStatement.created = Between(
        queryParams['fromDate']
          ? new Date(queryParams['fromDate'])
          : new Date(2000, 1, 1),
        queryParams['toDate'] ? new Date(queryParams['toDate']) : new Date(),
      );
    }
    return whereStatement;
  }
}
