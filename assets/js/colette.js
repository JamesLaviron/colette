// Polyfills
import '@babel/polyfill' // es polyfill
import 'dom4' // dom4 polyfill
import 'focus-visible' // focus-visible polyfill
// modules
import Blazy from 'blazy'
import Tablist from '@accede-web/tablist'
import IframeResizer from './modules/iframeResizer'
import FontLoader from './modules/fontLoader'
import Pager from './modules/pager'
import Modal from './modules/modal'
import fontsData from '../../fontfaces.json'

/**
 * Colette
 * @namespace colette
 */
const colette = window.colette || {}

/**
 * IframeResizer constructor
 * @memberof colette
 * @inner
 */
colette.IframeResizer = IframeResizer

/**
 * FontFaceLoader instance
 * @memberof colette
 * @inner
 */
colette.fonts = new FontLoader({ data: fontsData })

/**
 * Pager Constructor
 * @memberof colette
 * @inner
 */
colette.Pager = Pager

/**
 * Pager Instances Colection
 * @memberof colette
 * @inner
 */
colette.pagers = []
Array.prototype.forEach.call(document.querySelectorAll('.block-list'), (item) => {
  colette.pagers.push(new Pager({ blockList: item }))
})

/**
 * Modal Constructor
 * @memberof colette
 * @inner
 */
colette.Modal = Modal

// init demo modal
const demoModal = new colette.Modal({
  containerId: 'accessible-modal',
  containerClasses: ['demoModal'],
  modalContentClasses: ['pa3'],
  modalWindowClasses: ['box'],
  content: 'This is an accessible modal',
})
demoModal.insert()
demoModal.init()

/**
 * Tablist Constructor
 * @memberof colette
 * @inner
 */
colette.Tablist = Tablist

/**
 * Tablist Instances Colection
 * @memberof colette
 * @inner
 */
colette.tablists = []
Array.prototype.forEach.call(document.querySelectorAll('.tabpanel-list'), (item) => {
  const tab = new Tablist(item)
  item.closest('.tabpanel').removeAttribute('data-loading')
  tab.mount()
  colette.tablists.push(tab)
})

/**
 * Blazy instance
 * @memberof colette
 * @inner
 */
colette.lazy = new Blazy({
  offset: 500,
})

// Colette global object
export { colette }
