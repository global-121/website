import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';

import { FormErrorComponent } from '~/components/form-error/form-error.component';
import { generateFieldErrors } from '~/utils/form-validation';

@Component({
  selector: 'app-change-status-contents-without-message',
  standalone: true,
  imports: [
    ButtonModule,
    CheckboxModule,
    ReactiveFormsModule,
    FormErrorComponent,
  ],
  templateUrl: './change-status-contents-without-message.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangeStatusContentsWithoutMessageComponent {
  showAreYouSureCheckbox = input.required<boolean>();
  readonly onCancel = output();
  readonly onConfirm = output();

  formGroup = new FormGroup({
    confirmAction: new FormControl<boolean>(false, {
      nonNullable: true,
    }),
  });
  formFieldErrors = generateFieldErrors(this.formGroup, {
    confirmAction: (control) => {
      if (control.errors?.required) {
        return $localize`The checkbox should be checked.`;
      }
      return;
    },
  });

  constructor() {
    effect(() => {
      const confirmActionField = this.formGroup.controls.confirmAction;
      confirmActionField.setValidators([
        this.showAreYouSureCheckbox()
          ? // eslint-disable-next-line @typescript-eslint/unbound-method
            Validators.requiredTrue
          : // eslint-disable-next-line @typescript-eslint/unbound-method
            Validators.nullValidator,
      ]);
      confirmActionField.updateValueAndValidity();
    });
  }

  onSubmit() {
    this.formGroup.markAllAsTouched();
    if (!this.formGroup.valid) {
      return;
    }
    this.onConfirm.emit();
  }

  cancelClick() {
    this.onCancel.emit();
  }
}
