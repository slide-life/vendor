import API from '../utils/api';

var Block = {
  CACHED_BLOCKS: {},

  _inherits: function (field) {
    if ('_inherits' in field) {
      return [field._inherits];
    } else {
      return [];
    }
  },

  _components: function (field) {
    if ('_components' in field) {
      return field._components;
    } else {
      return [];
    }
  },

  _pathOf: function (field) {
    if (field.indexOf(':') > -1) {
      return field.split(':')[1];
    } else {
      return field;
    }
  },

  _separatePath: function (field) {
    return field.split('.');
  },

  _componentName: function (field) {
    return Block._separatePath(Block._pathOf(field)).pop();
  },

  _isRoot: function (inheritance) {
    return inheritance[inheritance.length - 1] === ':';
  },

  _retrieveBlock: function (path, cb) {
    if (Block.CACHED_BLOCKS[path.organization]) {
      cb(Block.CACHED_BLOCKS[path.organization]);
    } else {
      API.get('/blocks', {
        data: { organization: path.organization },
        success: function (block) {
          Block.CACHED_BLOCKS[path.organization] = block;
          cb(block);
        }
      });
    }
  },

  _resolveForIdentifier: function (identifier, cb) {
    Block._resolve(Block.getPathForIdentifier(identifier), cb);
  },

  _resolve: function (path, cb) {
    Block._retrieveBlock(path, function (block) {
      var hierarchy = path.hierarchy;
      var remaining_path = hierarchy.slice(0);
      var field = block.schema;

      while (remaining_path[0] in field) {
        field = field[remaining_path[0]];
        remaining_path = remaining_path.slice(1);
      }

      if (remaining_path.length === 0) {
        cb(hierarchy, block);
      } else {
        Block._inherits(field).forEach(function (inheritance) {
          var inheritanceIdentifier;
          if (Block._isRoot(inheritance)) {
            inheritanceIdentifier = inheritance + remaining_path.join('.');
          } else {
            inheritanceIdentifier = [inheritance].concat(remaining_path).join('.');
          }

          Block._resolveForIdentifier(inheritanceIdentifier, cb);
        });

        Block._components(field).filter(function (component) {
          return Block._componentName(component) === remaining_path[0];
        }).forEach(function (component) {
          var inheritanceIdentifier =
            [component].concat(remaining_path.slice(1)).join('.');
          Block._resolveForIdentifier(inheritanceIdentifier, cb);
        });
      }
    });
  },

  _resolveField: function (path, cb) {
    Block._resolve(path, function (resultHierarchy, resultBlock) {
      cb(resultHierarchy.reduce(function (obj, key) { return obj[key]; },
                                resultBlock.schema));
    });
  },

  _retrieveField: function (path, cb) {
    Block._resolveField(path, function (field) {
      var deferreds = [];

      if (field._components) {
        field._components.map(Block.getPathForIdentifier).forEach(function (componentPath) {
          var deferred = new $.Deferred();
          deferreds.push(deferred);

          Block._retrieveField(componentPath, function (f) {
            field[componentPath.hierarchy.pop()] = f;
            deferred.resolve();
          });
        });
      }

      if (field._inherits) {
        var inheritPath = Block.getPathForIdentifier(field._inherits);

        var deferred = new $.Deferred();
        deferreds.push(deferred);

        Block._retrieveField(inheritPath, function (f) {
          field = $.extend({}, f, field);
          deferred.resolve();
        });
      }

      $.when.apply($, deferreds).done(function () {
        delete field._components;
        delete field._inherits;
        cb(field);
      });
    });
  },

  getPathForIdentifier: function (identifier) {
    identifier = (identifier.indexOf(':') < 0) ? Slide.DEFAULT_ORGANIZATION + ':' + identifier : identifier;
    var deconstructed = identifier.split(':');
    return {
      organization: deconstructed[0],
      hierarchy: deconstructed[1].split('.'),
      identifier: identifier
    };
  },

  deconstructField: function (field) {
    var children = {},
    annotations = {};

    for (var key in field) {
      if (field.hasOwnProperty(key)) {
        if (key[0] === '_') {
          annotations[key] = field[key];
        } else {
          children[key] = field[key];
        }
      }
    }

    return { children: children, annotations: annotations };
  },

  getChildren: function (field) {
    return Block.deconstructField(field).children;
  },

  getAnnotations: function (field) {
    return Block.deconstructField(field).annotations;
  },

  flattenField: function (identifier, field) {
    var children = Block.getChildren(field);
    if (Object.keys(children).length > 0) {
      return Object.keys(children).reduce(function (merged, id) {
        return $.extend(merged, Block.flattenField(identifier + '.' + id, field[id]));
      }, {});
    } else {
      var leaf = {};
      leaf[identifier] = field;
      return leaf;
    }
  },

  getFlattenedFieldsForIdentifiers: function (identifiers, cb) {
    Block.getFieldsForIdentifiers(identifiers, function (unflattenedFields) {
      var fields = {};
      $.each(unflattenedFields, function (identifier, field) {
        $.extend(fields, Block.flattenField(identifier, field));
      });
      cb(fields);
    });
  },

  getFieldsForIdentifiers: function (identifiers, cb) {
    var fields = {},
    deferreds = [],
    paths = identifiers.map(Block.getPathForIdentifier);

    paths.forEach(function (path) {
      var deferred = new $.Deferred();
      deferreds.push(deferred);
      Block._retrieveField(path, function (field) {
        fields[path.identifier] = field;
        deferred.resolve();
      });
    });

    $.when.apply($, deferreds).done(function () {
      cb(fields);
    });
  }
};

export default Block;
