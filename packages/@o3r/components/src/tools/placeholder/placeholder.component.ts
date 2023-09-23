import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnDestroy,
  ViewEncapsulation
} from '@angular/core';
import {Store} from '@ngrx/store';
import {Observable, ReplaySubject, Subscription} from 'rxjs';
import {distinctUntilChanged, map, switchMap} from 'rxjs/operators';
import {PlaceholderTemplateStore, selectPlaceholderRenderedTemplates} from '../../stores/placeholder-template';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

/**
 * Placeholder component that is bind to the PlaceholderTemplateStore to display a template based on its ID
 * A loading indication can be provided via projection
 * @example
 *  <o3r-placeholder id="my-template-id">Is loading ...</o3r-placeholder>
 */
@Component({
  selector: 'o3r-placeholder',
  template: `<ng-content *ngIf="(isPending$ | async); else displayTemplate"></ng-content>
<ng-template #displayTemplate>
  <ng-container *ngIf="template$ | async as template">
    <div *ngIf="!template.templateObjectUrl && template.content" [innerHTML]="template.content"></div>
    <iframe *ngIf="template.templateObjectUrl" [src]="template.templateObjectUrl"></iframe>
  </ng-container>
</ng-template>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class PlaceholderComponent implements OnDestroy {

  private subscription = new Subscription();

  private id$ = new ReplaySubject<string>(1);

  /** Determine if the placeholder content is pending */
  public isPending$: Observable<boolean>;

  /** Generated HTML template */
  public template$: Observable<{ content: string | undefined; templateObjectUrl: SafeResourceUrl | undefined}>;

  /** template identify */
  @Input()
  public set id(value: string) {
    this.id$.next(value);
  }
  // TODO: incorporate third-party library
  constructor(store: Store<PlaceholderTemplateStore>, sanitizer: DomSanitizer) {
    const storeState$ = this.id$.pipe(
      distinctUntilChanged(),
      switchMap((id) => store.select(selectPlaceholderRenderedTemplates(id)))
    );
    this.isPending$ = storeState$.pipe(map((templates) => !!templates?.isPending));
    this.template$ = storeState$.pipe(
      map((templates) => {
        const orderedRenderedTemplates = templates?.orderedRenderedTemplates;
        const content = orderedRenderedTemplates?.length && orderedRenderedTemplates.join('') || undefined;
        const templateObjectUrl = templates?.isolated && content ? sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(new Blob([content], { type: 'text/html' }))) : undefined;
        return { content, templateObjectUrl };
      }));
  }


  /** @inheritdoc */
  public ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
