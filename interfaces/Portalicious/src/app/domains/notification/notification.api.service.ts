import { inject, Injectable, LOCALE_ID, Signal } from '@angular/core';

import { DomainApiService } from '~/domains/domain-api.service';
import {
  MessageTemplate,
  MessageTemplateWithTranslatedLabel,
} from '~/domains/notification/notification.model';
import { TranslatableStringService } from '~/services/translatable-string.service';
import { getLanguageEnumFromLocale, Locale } from '~/utils/locale';

const BASE_ENDPOINT = (projectId: Signal<number | string>) => [
  'notifications',
  projectId,
];

@Injectable({
  providedIn: 'root',
})
export class NotificationApiService extends DomainApiService {
  private locale = inject<Locale>(LOCALE_ID);
  private readonly translatableStringService = inject(
    TranslatableStringService,
  );

  getMessageTemplates(projectId: Signal<number | string | undefined>) {
    return this.generateQueryOptions<
      MessageTemplate[],
      MessageTemplateWithTranslatedLabel[]
    >({
      path: [
        ...BASE_ENDPOINT(projectId as Signal<number | string>),
        'message-templates',
      ],
      processResponse: (response) =>
        response
          .filter(
            (template) =>
              template.isSendMessageTemplate &&
              template.language ===
                getLanguageEnumFromLocale(this.locale).toString(),
          )
          .map((template) => ({
            ...template,
            label:
              this.translatableStringService.translate(template.label) ??
              $localize`<UNNAMED TEMPLATE>`,
          }))
          .sort((a, b) => a.label.localeCompare(b.label)),
      enabled: () => !!projectId(),
    });
  }

  public invalidateMessageTemplates(
    projectId: Signal<number | string>,
  ): Promise<void> {
    const path = [...BASE_ENDPOINT(projectId), 'message-templates'];

    return this.queryClient.invalidateQueries({
      queryKey: this.pathToQueryKey(path),
    });
  }
}
