import { Link, Config } from './types'
import { addAssetsToAlbum, searchAssets } from '@immich/sdk'
import store from './store'
import path from 'path'

export class PersonToAlbum {
  config: Config

  constructor () {
    this.initConfig()
  }

  /**
   * Read the config.json file or parse the CONFIG env value to get the configuration
   */
  initConfig () {
    try {
      if (process.env.CONFIG) {
        // Attempt to parse docker-compose config string into JSON (if specified)
        this.config = JSON.parse(process.env.CONFIG)
      } else {
        const configJson = require(path.resolve('../data/config.json'))
        if (typeof configJson === 'object') this.config = configJson
      }
    } catch (e) {
      console.log(e)
      console.log('Unable to parse config file.')
    }
  }

  async processPerson (link: Link) {
    let nextPage: string | null = '1'
    let mostRecent

    if (link.description) console.log(`=== ${link.description} ===`)
    
    // Get the person IDs to search for
    const searchPersonIds = link.personIds && link.personIds.length > 0 
      ? link.personIds 
      : [link.personId!]
    
    // Determine operation type (defaults to OR for backward compatibility)
    const operation = link.operation || 'OR'
    
    // Log the operation
    if (searchPersonIds.length > 1) {
      console.log(`Adding photos with ${operation} operation for persons [${searchPersonIds.join(', ')}] to album ${link.albumId}`)
    } else {
      console.log(`Adding person ${searchPersonIds[0]} to album ${link.albumId}`)
    }
    
    if (link.excludePersonIds && link.excludePersonIds.length > 0) {
      console.log(`Excluding persons: [${link.excludePersonIds.join(', ')}]`)
    }
    
    if (link.excludeOthers) {
      console.log(`Excluding all other people (only specified persons allowed)`)
      // Log warning if excludePersonIds is also specified (redundant)
      if (link.excludePersonIds && link.excludePersonIds.length > 0) {
        console.log(`Warning: excludePersonIds is redundant when excludeOthers is true`)
      }
    }

    while (nextPage !== null) {
      console.log(` - Processing page ${nextPage}`)
      
      const res = await searchAssets({
        metadataSearchDto: {
          updatedAfter: store.get(this.getUpdateKeyName(link)),
          page: parseInt(nextPage, 10),
          personIds: searchPersonIds
        }
      })
      
      // Track the most recent photo timestamp
      if (!mostRecent && res.assets.items.length > 0) {
        mostRecent = res.assets.items[0].updatedAt
      }

      // Filter assets based on operation type
      let filteredAssets = res.assets.items

      // AND operation: Only include assets that have ALL specified persons
      if (operation === 'AND' && searchPersonIds.length > 1) {
        filteredAssets = filteredAssets.filter(asset => {
          const assetPersonIds = asset.people?.map(p => p.id) || []
          return searchPersonIds.every(personId => assetPersonIds.includes(personId))
        })
      }
      // OR operation: No filtering needed - API already returns assets with ANY of the persons

      // NOT operation: Exclude assets that have any excluded persons
      if (link.excludePersonIds && link.excludePersonIds.length > 0) {
        filteredAssets = filteredAssets.filter(asset => {
          const assetPersonIds = asset.people?.map(p => p.id) || []
          return !link.excludePersonIds!.some(personId => assetPersonIds.includes(personId))
        })
      }

      // EXCLUDE OTHERS: Only include assets that have EXACTLY the specified persons (no one else)
      if (link.excludeOthers) {
        const specifiedPersonIds = new Set(searchPersonIds)
        
        filteredAssets = filteredAssets.filter(asset => {
          const assetPersonIds = asset.people?.map(p => p.id) || []
          
          // Check if asset has ONLY the specified persons
          // Every person in the photo must be in our specified list
          // And no extra people should be detected
          return assetPersonIds.every(id => specifiedPersonIds.has(id))
        })
      }

      if (filteredAssets.length > 0) {
        await addAssetsToAlbum({
          id: link.albumId,
          bulkIdsDto: {
            ids: filteredAssets.map(x => x.id)
          }
        })
        console.log(`   Added ${filteredAssets.length} assets`)
      } else {
        console.log(`   No assets matched criteria`)
      }

      nextPage = res.assets.nextPage
    }

    // Store the most recent asset update value
    if (mostRecent) {
      await store.set(this.getUpdateKeyName(link), mostRecent)
    }
    console.log()
  }

  /**
   * Get the correctly formatted key name for most-recent updated value in the store
   */
  getUpdateKeyName (link: Link) {
    const personKey = link.personIds && link.personIds.length > 0
      ? link.personIds.sort().join(',')
      : link.personId || ''
    const operation = link.operation || 'OR'
    const excludeOthers = link.excludeOthers ? 'exclusive' : ''
    return [link.apiKeyShort, personKey, operation, excludeOthers, link.albumId].join(':')
  }
}