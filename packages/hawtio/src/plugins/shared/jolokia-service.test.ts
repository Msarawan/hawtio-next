import { userService } from '@hawtiosrc/auth'
import Jolokia, { ListRequestOptions } from 'jolokia.js'
import { DEFAULT_MAX_COLLECTION_SIZE, DEFAULT_MAX_DEPTH, JolokiaListMethod, jolokiaService } from './jolokia-service'

describe('JolokiaService', () => {
  beforeEach(() => {
    jest.resetModules()
    localStorage.clear()
    jolokiaService.reset()

    userService.isLogin = jest.fn(async () => true)
  })

  test('getJolokiaUrl - not logged in', async () => {
    userService.isLogin = jest.fn(async () => false)
    await expect(jolokiaService.getJolokiaUrl()).rejects.toThrow()
  })

  test('getJolokiaUrl - null', async () => {
    await expect(jolokiaService.getJolokiaUrl()).resolves.toBeNull()
  })

  test('getJolokia - optimised', async () => {
    jolokiaService.getJolokiaUrl = jest.fn(async () => '/test')
    Jolokia.prototype.list = jest.fn((path?: string | string[] | ListRequestOptions, opts?: ListRequestOptions) => {
      if (typeof path !== 'string') throw new Error('String is expected for path')
      if (!opts) throw new Error('No options set')
      if (!opts.success) throw new Error('No success option set')

      opts.success({
        desc: '',
        attr: {},
        op: {
          value: { desc: 'exec', args: [], ret: '' },
        },
      })
      return null
    })

    await expect(jolokiaService.getJolokia()).resolves.not.toThrow()
    await expect(jolokiaService.getListMethod()).resolves.toEqual(JolokiaListMethod.OPTIMISED)
  })

  test('getJolokia - default', async () => {
    jolokiaService.getJolokiaUrl = jest.fn(async () => '/test')
    Jolokia.prototype.list = jest.fn((path?: string | string[] | ListRequestOptions, opts?: ListRequestOptions) => {
      if (typeof path !== 'string') throw new Error('String is expected for path')
      if (!opts) throw new Error('No options set')
      if (!opts.error) throw new Error('No error option set')

      opts.error({
        status: -1,
        timestamp: 123456789,
        request: { type: 'list', path: path },
        value: null,
        error_type: 'non-exist',
        error: 'ERROR HAS OCCURRED',
        stacktrace: 'not available',
      })
      return null
    })

    await expect(jolokiaService.getJolokia()).resolves.not.toThrow()
    await expect(jolokiaService.getListMethod()).resolves.toEqual(JolokiaListMethod.DEFAULT)
  })

  test('load and save Jolokia options', () => {
    let options = jolokiaService.loadJolokiaStoredOptions()
    expect(options.maxDepth).toEqual(DEFAULT_MAX_DEPTH)
    expect(options.maxCollectionSize).toEqual(DEFAULT_MAX_COLLECTION_SIZE)

    jolokiaService.saveJolokiaStoredOptions({ maxDepth: 3, maxCollectionSize: 10000 })
    options = jolokiaService.loadJolokiaStoredOptions()
    expect(options.maxDepth).toEqual(3)
    expect(options.maxCollectionSize).toEqual(10000)
  })
})
