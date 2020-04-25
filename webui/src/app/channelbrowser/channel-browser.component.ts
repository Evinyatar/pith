import {switchMap} from 'rxjs/operators';
import {AfterViewInit, Component, Input, OnInit, ViewChild, ViewChildren} from '@angular/core';
import {ActivatedRoute, ParamMap} from '@angular/router';
import {Channel, ChannelItem, PithClientService} from '../core/pith-client.service';
import 'rxjs/Rx';
import {animate, state, style, transition, trigger} from '@angular/animations';

const animationTiming = '500ms ease';

@Component({
  templateUrl: './channel-browser.component.html',
  animations: [
    trigger(
      'enterAnimation', [
        transition(':enter', [
          style({transform: 'scale(0.5)', opacity: 0}),
          animate('200ms', style({transform: 'scale(1)', opacity: 1}))
        ]),
        transition(':leave', [
          style({transform: 'scale(1)', opacity: 1}),
          animate('200ms', style({transform: 'scale(0.5)', opacity: 0}))
        ])
      ]
    )
  ]
})
export class ChannelBrowserComponent implements AfterViewInit, OnInit {
  itemDetails: ChannelItem;
  channel: Channel;
  private currentContainerId: string;
  private contents: ChannelItem[];
  filteredContents: ChannelItem[];
  currentPath: ChannelItem[] = [];

  public showDetailsItem: ChannelItem;
  public showDetailsId: string;
  public showDetailsIdx: number;
  public showDetails: boolean;

  private currentSearch: string;

  private itemsPerRow: number;

  limit = 150;

  @ViewChild('container', { static: true }) container;
  @ViewChildren('cell') cells;

  fieldDescriptions = {
    year: 'Year',
    rating: 'Rating',
    releaseDate: 'Release date',
    title: 'Title',
    runtime: 'Runtime',
    creationTime: 'Date added'
  };

  resetItemOffsets() {
    this.itemsPerRow = Math.floor((window.innerWidth - 20) / 110); // defined in poster.scss through the media queries
  }

  ngAfterViewInit() {
    this.resetItemOffsets();
    window.addEventListener('resize', () => {
      this.resetItemOffsets();
    });
  }

  constructor(private route: ActivatedRoute,
              private pithClient: PithClientService) {
  }

  fetchContents() {
    this.toggle(null);
    this.channel.listContents(this.currentContainerId).subscribe(contents => {
      this.contents = contents;
      this.search(this.currentSearch, true);
    });
    this.channel.getDetails(this.currentContainerId).subscribe(details => this.itemDetails = details);
  }

  ngOnInit() {
    this.route.paramMap.pipe(switchMap((params: ParamMap) => {
      const id = params.get('id');
      return this.pithClient.getChannel(id);
    })).subscribe((channel: Channel) => {
      this.channel = channel;
      this.currentContainerId = '';
      this.currentPath = [];
      this.fetchContents();
    });
  }

  toggle(item: ChannelItem, idx?) {
      if (item == null || this.showDetailsId === item.id) {
        this.showDetailsId = null;
        this.showDetails = false;
        this.showDetailsIdx = -1;
        this.showDetailsItem = null;
      } else {
        this.showDetailsId = item.id;
        this.showDetails = true;
        this.showDetailsIdx = idx;
        this.showDetailsItem = item;
      }
  }

  @Input()
  set searchString(value) {
    this.search(value);
  }

  search(value: string, forceFull?: boolean) {
    if (!value) {
      this.filteredContents = this.contents;
    } else {
      const filter = ((i) => i.title.toLocaleLowerCase().indexOf(value.toLocaleLowerCase()) != -1);
      if (!forceFull && this.currentSearch && value.indexOf(this.currentSearch) != -1) {
        this.filteredContents = this.filteredContents.filter(filter);
      } else {
        this.filteredContents = this.contents.filter(filter);
      }
    }
    this.currentSearch = value;
  }

  sort(sortField: string) {
    let direction;
    let transform = (x) => x;
    switch (sortField) {
      case 'year':
      case 'creationTime':
      case 'releaseDate':
      case 'rating':
        direction = -1;
        break;
      case 'title':
        transform = (x) => x.toUpperCase();
      default:
        direction = 1;
    }
    const compareFn = function(a, b) {
      return direction * (transform(a[sortField]) < transform(b[sortField]) ? -1 : transform(a[sortField]) > transform(b[sortField]) ? 1 : 0);
    };
    this.contents.sort(compareFn);
    this.filteredContents.sort(compareFn);
  }

  open(item: ChannelItem) {
    this.currentContainerId = item.id;
    this.fetchContents();
    this.currentPath.push(item);
  }

  goBack(item) {
    const x = this.currentPath.indexOf(item);
    this.currentPath.splice(x + 1);
    this.currentContainerId = item.id;
    this.fetchContents();
  }

  goToChannelRoot() {
    this.currentPath = [];
    this.currentContainerId = '';
    this.fetchContents();
  }

  rowIdx(idx) {
    return Math.floor(idx / this.itemsPerRow);
  }

  loadMore() {
    this.limit += 150;
  }
}
