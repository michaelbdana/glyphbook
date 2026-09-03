declare module "pagedjs" {
  export type PagedFlow = {
    total: number;
    pages: unknown[];
    performance: number;
  };

  export class Previewer {
    preview(): Promise<PagedFlow>;
    preview(content: string, stylesheets: string[], renderTo: HTMLElement): Promise<PagedFlow>;
  }
}
