import { db } from '../Mongo';
import { positionToChunkId } from '../utils/chunks';

export default class ChunkState {
  constructor(globalState, id) {
    this.globalState = globalState;
    this.id = id;

    this.gameObjects = null;
    this.hasChanges = false;

    this.updatedObjects = new Set();
    // TODO: Учесть ситуацию когда одним действием в tick объект уходит за пределы chunk
    // а другим действием в этом же tick возвращается в этот chunk
    this.removedObjects = new Set();

    this.loading = new Promise(resolve => {
      this._resolveLoading = resolve;
    });
  }

  async load() {
    this._resolveLoading(this._load());
    await this.loading;
    this.loading = null;
  }

  async _load() {
    const objects = await db()
      .gameObjects.find({
        chunkId: this.id,
      })
      .toArray();

    const items = objects.map(obj => {
      obj.id = obj._id.toString();

      return [obj.id, obj];
    });

    this.gameObjects = new Map(items);
  }

  async saveChanges() {
    await Promise.all(
      Array.from(this.updatedObjects).map(obj =>
        db().gameObjects.updateOne(
          { _id: obj._id },
          {
            $set: {
              chunkId: obj.chunkId,
              position: obj.position,
            },
          }
        )
      )
    );

    this.updatedObjects = new Set();
    this.removedObjects = new Set();
    this.hasChanges = false;
  }

  async addObject(obj) {
    obj.chunkId = this.id;

    await this.loading;

    this.gameObjects.set(obj.id, obj);
    this.updatedObjects.add(obj);
  }

  getObjectsExceptMeJSON(playerId) {
    const items = [];

    for (const [id, obj] of this.gameObjects) {
      if (id !== playerId) {
        items.push(formatObject(obj));
      }
    }

    return items;
  }

  async updatePosition(obj, pos) {
    const chunkId = positionToChunkId(pos);

    obj.position = pos;

    if (chunkId === this.id) {
      this.updatedObjects.add(obj);
      this.hasChanges = true;
    } else {
      this.gameObjects.delete(obj.id);
      this.removedObjects.add(obj);

      const moveToChunk = this.globalState.getChunkIfLoaded(chunkId);

      if (moveToChunk) {
        await moveToChunk.addObject(obj);
      }
    }
  }
}

export function formatObject(obj) {
  return {
    id: obj.id,
    type: obj.type,
    position: obj.position,
  };
}