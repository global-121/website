import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
} from '@angular/core';

import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';

@Component({
  selector: 'app-button-menu',
  imports: [ButtonModule, MenuModule, NgClass],
  templateUrl: './button-menu.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonMenuComponent {
  readonly label = input.required<string>();
  readonly menuItems = input.required<MenuItem[]>();
  readonly icon = input<string>();
  readonly outlined = input<boolean>(false);
  readonly plain = input<boolean>(false);
  readonly text = input<boolean>(false);
  readonly size = input<'large' | 'small'>();

  readonly menuOpen = model(false);

  // Filter out items without command or visible children as these than look like a subheader without any action or children or routerlink
  readonly filteredMenuItems = computed(() =>
    this.menuItems().filter((item) => {
      // For parent items, check if they have a command or visible children
      const hasCommand = !!item.command;
      const hasVisibleChildren =
        item.items?.some((child) => child.visible !== false) ?? false;
      // Keep if either has command or visible children
      const hasRouteLink = !!item.routerLink;
      return hasCommand || hasVisibleChildren || hasRouteLink;
    }),
  );
}
