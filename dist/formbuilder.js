(function() {
  rivets.binders.append = {
    routine: function(el, value) {
      return el.checked = _.find(value, function(item) {
        return String(item) === String(el.value);
      }) !== void 0;
    },
    bind: function(el) {
      var _this = this;
      this.callback = function() {
        var currentValue, newValue;
        currentValue = _.clone(_this.model.get(_this.keypath)) || [];
        if (el.value && _.contains(currentValue, el.value)) {
          newValue = _.without(currentValue, el.value);
          return _this.model.set(_this.keypath, currentValue);
        } else {
          currentValue.push(el.value);
          return _this.model.set(_this.keypath, currentValue);
        }
      };
      return $(el).on('change', this.callback);
    },
    unbind: function(el) {
      return $(el).off('change', this.callback);
    }
  };

  rivets.formatters.length = function(value) {
    if (value) {
      return value.length;
    } else {
      return 0;
    }
  };

  rivets.binders.input = {
    publishes: true,
    routine: rivets.binders.value.routine,
    bind: function(el) {
      return $(el).bind('input.rivets', this.publish);
    },
    unbind: function(el) {
      return $(el).unbind('input.rivets');
    }
  };

  rivets.configure({
    prefix: "rv",
    adapter: {
      subscribe: function(obj, keypath, callback) {
        callback.wrapped = function(m, v) {
          return callback(v);
        };
        return obj.on('change:' + keypath, callback.wrapped);
      },
      unsubscribe: function(obj, keypath, callback) {
        return obj.off('change:' + keypath, callback.wrapped);
      },
      read: function(obj, keypath) {
        if (keypath === "cid") {
          return obj.cid;
        }
        return obj.get(keypath);
      },
      publish: function(obj, keypath, value) {
        if (obj.cid) {
          return obj.set(keypath, value);
        } else {
          return obj[keypath] = value;
        }
      }
    }
  });

}).call(this);

(function() {
  var BuilderView, EditFieldView, Formbuilder, FormbuilderCollection, FormbuilderModel, GridFieldView, TableFieldView, ViewFieldView, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  FormbuilderModel = (function(_super) {
    __extends(FormbuilderModel, _super);

    function FormbuilderModel() {
      _ref = FormbuilderModel.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    FormbuilderModel.prototype.sync = function() {};

    FormbuilderModel.prototype.indexInDOM = function() {
      var $wrapper,
        _this = this;
      $wrapper = $(".fb-field-wrapper").filter((function(_, el) {
        return $(el).data('cid') === _this.cid;
      }));
      return $wrapper.index(".fb-field-wrapper");
    };

    FormbuilderModel.prototype.is_input = function() {
      return Formbuilder.inputFields[this.get(Formbuilder.options.mappings.TYPE)] != null;
    };

    FormbuilderModel.prototype.initialize = function() {
      if (this.attributes.uuid == null) {
        this.attributes.uuid = uuid.v4();
      }
      if (!this.attributes.parent_uuid === void 0) {
        this.attributes.parent_uuid = null;
      }
      return this.attachMethods();
    };

    FormbuilderModel.prototype.parentModel = function() {
      return this.collection.findWhereUuid(this.get('parent_uuid'));
    };

    FormbuilderModel.prototype.hasParent = function() {
      return this.parentModel !== void 0;
    };

    FormbuilderModel.prototype.inTable = function() {
      var parent;
      parent = this.parentModel();
      return parent && parent.get('type') === 'table';
    };

    FormbuilderModel.prototype.attachMethods = function() {
      if (typeof this.attributes.initialize === 'function') {
        this.attributes.initialize.call(this);
        delete this.attributes['initialize'];
      }
      if (typeof this.attributes.insertion === 'function') {
        this['insertion'] = this.attributes['insertion'];
        delete this.attributes['insertion'];
      }
      return _.each(this.attributes, function(method, name) {
        if (typeof method === 'function' && this[name] === void 0) {
          this[name] = method;
          return delete this.attributes[name];
        }
      }, this);
    };

    return FormbuilderModel;

  })(Backbone.DeepModel);

  FormbuilderCollection = (function(_super) {
    __extends(FormbuilderCollection, _super);

    function FormbuilderCollection() {
      _ref1 = FormbuilderCollection.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    FormbuilderCollection.prototype.model = FormbuilderModel;

    FormbuilderCollection.prototype.comparator = function(model) {
      return model.indexInDOM();
    };

    FormbuilderCollection.prototype.add = function(model) {
      var models;
      models = model = FormbuilderCollection.__super__.add.call(this, model);
      if (!_.isArray(model)) {
        models = [model];
      }
      _.each(models, function(model) {
        if (typeof model.insertion === 'function') {
          return model.insertion.call(model);
        }
      });
      return model;
    };

    FormbuilderCollection.prototype.findWhereUuid = function(uuid) {
      return this.findWhere({
        'uuid': uuid
      });
    };

    FormbuilderCollection.prototype.findDataSourceFields = function() {
      return this.where({
        'type': 'datasource'
      });
    };

    return FormbuilderCollection;

  })(Backbone.Collection);

  ViewFieldView = (function(_super) {
    __extends(ViewFieldView, _super);

    function ViewFieldView() {
      _ref2 = ViewFieldView.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    ViewFieldView.insert = function(builder, view, responseField, _, options) {
      var $replacePosition, appendEl, parentModel, replaceEl;
      parentModel = responseField.parentModel();
      if (parentModel === void 0 || parentModel.get('type') === 'grid' || parentModel.get('type') === 'table') {
        appendEl = options.$appendEl || null;
        replaceEl = options.$replaceEl || null;
        if (appendEl != null) {
          return appendEl.html(view.render().el);
        } else if (replaceEl != null) {
          return replaceEl.replaceWith(view.render().el);
        } else if ((options.position == null) || options.position === -1) {
          return builder.$responseFields.append(view.render().el);
        } else if (options.position === 0) {
          return builder.$responseFields.prepend(view.render().el);
        } else if (($replacePosition = builder.$responseFields.find(".fb-field-wrapper").eq(options.position))[0]) {
          return $replacePosition.before(view.render().el);
        } else {
          return builder.$responseFields.append(view.render().el);
        }
      }
    };

    ViewFieldView.prototype.className = "fb-field-wrapper";

    ViewFieldView.prototype.events = {
      'click .subtemplate-wrapper': 'focusEditView',
      'click .js-duplicate': 'duplicate',
      'click .js-clear': 'clear'
    };

    ViewFieldView.prototype.initialize = function(options) {
      this.parentView = options.parentView;
      this.listenTo(this.model, "change", this.render);
      return this.listenTo(this.model, "destroy", this.remove);
    };

    ViewFieldView.prototype.render = function() {
      this.$el.addClass('response-field-' + this.model.get(Formbuilder.options.mappings.TYPE)).data('cid', this.model.cid).data('uuid', this.model.get('uuid')).html(Formbuilder.templates["view/base" + (!this.model.is_input() ? '_non_input' : '')]({
        rf: this.model
      }));
      return this;
    };

    ViewFieldView.prototype.focusEditView = function() {
      return this.parentView.createAndShowEditView(this.model);
    };

    ViewFieldView.prototype.clear = function(e) {
      var cb, x,
        _this = this;
      e.preventDefault();
      e.stopPropagation();
      cb = function() {
        _this.parentView.handleFormUpdate();
        return _this.model.destroy();
      };
      x = Formbuilder.options.CLEAR_FIELD_CONFIRM;
      switch (typeof x) {
        case 'string':
          if (confirm(x)) {
            return cb();
          }
          break;
        case 'function':
          return x(cb);
        default:
          return cb();
      }
    };

    ViewFieldView.prototype.duplicate = function(e) {
      var attrs;
      e.preventDefault();
      e.stopPropagation();
      attrs = Formbuilder.helpers.clone(this.model.attributes);
      delete attrs['id'];
      delete attrs['cid'];
      delete attrs['uuid'];
      attrs['label'] += ' Copy';
      if (attrs.options.grid) {
        attrs.options.grid.row = attrs.options.grid.row + 1;
      }
      this.parentView.createField(attrs, {
        position: this.model.indexInDOM() + 1
      });
      return this.model.trigger("duplicate:viewfield");
    };

    return ViewFieldView;

  })(Backbone.View);

  TableFieldView = (function(_super) {
    __extends(TableFieldView, _super);

    function TableFieldView() {
      _ref3 = TableFieldView.__super__.constructor.apply(this, arguments);
      return _ref3;
    }

    TableFieldView.prototype.className = "fb-field-wrapper";

    TableFieldView.prototype.initialize = function(options) {
      this.parentView = options.parentView;
      this.listenTo(this.model, "change", this.update);
      this.listenTo(this.model, "destroy", this.remove);
      return _.each(this.model.get('options.elements'), function(element) {
        var childModel;
        childModel = this.model.collection.findWhereUuid(element.uuid);
        if (childModel) {
          this.listenTo(childModel, "change", this.update);
          return this.listenTo(childModel, "destroy", function(model) {
            return this.update(model);
          });
        } else {
          return console.log(element.uuid);
        }
      }, this);
    };

    TableFieldView.prototype.events = {
      'mouseenter': 'showSelectors',
      'mouseleave': 'removeSelectors',
      'click .drop-area li': 'inlineAdd',
      'click .subtemplate-wrapper': 'focusEditView',
      'click .response-field-table td.header': 'focusSubelement',
      'click .response-field-table td.element': 'focusSubelement',
      'click .js-clear': 'clear',
      'click .js-duplicate': 'duplicate'
    };

    TableFieldView.prototype.showSelectors = function(e) {
      return this.$el.find('.drop-area').html(Formbuilder.templates['view/element_selector']());
    };

    TableFieldView.prototype.removeSelectors = function(e) {
      return this.$el.find('.drop-area').html('');
    };

    TableFieldView.prototype.inlineAdd = function(e) {
      var childModel, elements, newElement;
      e.preventDefault();
      e.stopPropagation();
      childModel = new FormbuilderModel(Formbuilder.helpers.defaultFieldAttrs($(e.currentTarget).data('type')));
      childModel.set('parent_uuid', this.model.get('uuid'));
      childModel.set('options.in_sequence', true);
      this.listenTo(childModel, "change", this.update);
      elements = this.model.attributes.options.elements || [];
      newElement = {
        'uuid': childModel.get('uuid')
      };
      elements.push(newElement);
      this.model.attributes.options.elements = elements;
      this.parentView.collection.add(childModel);
      return this.update(childModel);
    };

    TableFieldView.prototype.update = function(model) {
      if (model) {
        this.render();
        return this.parentView.createAndShowEditView(model);
      }
    };

    TableFieldView.prototype.render = function() {
      TableFieldView.__super__.render.call(this);
      this.renderElements();
      return this;
    };

    TableFieldView.prototype.focusEditView = function(e) {
      if (!$(e.target).parents('.dropdown-toggle').length && !$(e.target).hasClass('dropdown-toggle')) {
        return this.parentView.createAndShowEditView(this.model);
      }
    };

    TableFieldView.prototype.focusSubelement = function(e) {
      var childUuid;
      e.preventDefault();
      e.stopPropagation();
      childUuid = $(e.currentTarget).data('uuid');
      if (childUuid) {
        return this.parentView.createAndShowEditView(this.parentView.modelByUuid(childUuid));
      }
    };

    TableFieldView.prototype.renderElements = function() {
      return _.each(this.model.get('options.elements'), function(element) {
        var model;
        model = this.parentView.modelByUuid(element.uuid);
        this.$el.find('.header-' + element.uuid).html(Formbuilder.templates["view/table_header"]({
          rf: model,
          element: element
        })).css('background-color', model.get(Formbuilder.options.mappings.LABEL_BACKGROUND_COLOR)).data('cid', model.cid);
        this.$el.find('.element-' + element.uuid).html(Formbuilder.templates["view/table_element"]({
          rf: model,
          element: element
        })).data('cid', model.cid);
        return this.$el.find('.total-' + element.uuid).html(Formbuilder.templates["view/table_total"]({
          rf: model,
          element: element
        })).data('cid', model.cid);
      }, this);
    };

    TableFieldView.prototype.clear = function(e) {
      var models, uuid;
      e.preventDefault();
      e.stopPropagation();
      uuid = $(e.currentTarget).parents('.element').data('uuid');
      if (uuid === void 0) {
        models = _.each(this.model.get('options.elements'), function(element) {
          this.parentView.modelByUuid(element.uuid).destroy();
          return true;
        }, this);
        this.model.destroy();
        return this.$el.remove();
      } else {
        this.parentView.modelByUuid(uuid).destroy();
        this.model.set('options.elements', _.filter(this.model.get('options.elements'), function(destroyedElement) {
          return destroyedElement.uuid !== uuid;
        }));
        return this.render();
      }
    };

    TableFieldView.prototype.duplicate = function() {
      var attrs, clonedTableModel, clonedView, elements,
        _this = this;
      attrs = Formbuilder.helpers.clone(this.model.attributes);
      delete attrs['id'];
      delete attrs['cid'];
      attrs['uuid'] = uuid.v4();
      attrs['label'] += ' Copy';
      elements = attrs['options']['elements'];
      attrs['options']['elements'] = [];
      attrs = _.extend({}, Formbuilder.helpers.defaultFieldAttrs('table'), attrs);
      this.parentView.createField(attrs, {
        position: -1
      });
      clonedView = this.parentView.viewByUuid(attrs['uuid']);
      clonedTableModel = this.parentView.modelByUuid(attrs['uuid']);
      _.each(elements, function(child) {
        var childModel, childattrs, clonedModel, totalColumnModel;
        childModel = _this.parentView.modelByUuid(child.uuid);
        childattrs = Formbuilder.helpers.clone(childModel);
        delete childattrs['id'];
        delete childattrs['cid'];
        child.uuid = childattrs['uuid'] = uuid.v4();
        childattrs['parent_uuid'] = attrs['uuid'];
        childattrs = _.extend({}, Formbuilder.helpers.defaultFieldAttrs(childattrs['type']), childattrs);
        clonedModel = new FormbuilderModel(childattrs);
        if (child.totalColumn) {
          totalColumnModel = clonedTableModel.createTotalColumnModel(childattrs['uuid']);
          child.totalColumnUuid = totalColumnModel.get('uuid');
        }
        _this.parentView.collection.add(clonedModel);
        if (clonedModel.expression !== void 0 && clonedModel.get('options.calculation_type')) {
          clonedModel.expression();
        }
        clonedView.listenTo(clonedModel, "change", clonedView.update);
        return attrs['options']['elements'].push(child);
      });
      return clonedView.render();
    };

    TableFieldView.insert = function(builder, view, responseField, _, options) {
      var instanceView;
      instanceView = builder.viewByUuid(responseField.get('parent_uuid'));
      if (instanceView != null) {
        return true;
      } else {
        return false;
      }
    };

    return TableFieldView;

  })(ViewFieldView);

  GridFieldView = (function(_super) {
    __extends(GridFieldView, _super);

    function GridFieldView() {
      _ref4 = GridFieldView.__super__.constructor.apply(this, arguments);
      return _ref4;
    }

    GridFieldView.prototype.className = "fb-field-wrapper";

    GridFieldView.prototype.events = {
      'click .response-field-grid-cell li': 'inlineAdd',
      'click .response-field-grid-cell .js-clear': 'subelementClear',
      'click .js-duplicate': 'duplicate',
      'click .js-clear': 'clear',
      'click .subtemplate-wrapper': 'focusEditView'
    };

    GridFieldView.prototype.initialize = function(options) {
      this.parentView = options.parentView;
      this.listenTo(this.model, "change", this.redraw);
      this.listenTo(this.model, "destroy", this.remove);
      this.parentView.collection.bind('add', this.addSubelement, this);
      this.parentView.collection.bind('destroy', this.removeSubelement, this);
      return this.render;
    };

    GridFieldView.prototype.render = function() {
      GridFieldView.__super__.render.call(this);
      this.redraw();
      this.renderChildren();
      return this;
    };

    GridFieldView.prototype.redraw = function() {
      var table;
      table = this.$el.find('.response-field-grid-table').detach();
      this.$el.addClass('response-field-' + this.model.get(Formbuilder.options.mappings.TYPE)).data('cid', this.model.cid).data('uuid', this.model.get('uuid')).html(Formbuilder.templates["view/base" + (!this.model.is_input() ? '_non_input' : '')]({
        rf: this.model
      }));
      if (table.length === 1) {
        this.$el.find('.response-field-grid-table').replaceWith(table);
      }
      return this.renderTable();
    };

    GridFieldView.prototype.renderTable = function() {
      var currentCols, currentRows, numCols, numRows, rows, subelements, table, _i, _ref5, _results,
        _this = this;
      numRows = this.model.get('options.num_rows') || 1;
      numCols = this.model.get('options.num_cols') || 1;
      table = this.$el.find('table');
      currentRows = table.find('tr').length;
      currentCols = table.find("tr:nth-child(1) td").length;
      rows = $.makeArray(table.find('tr'));
      if (currentRows < numRows) {
        rows = rows.concat((function() {
          _results = [];
          for (var _i = _ref5 = rows.length; _ref5 <= numRows ? _i < numRows : _i > numRows; _ref5 <= numRows ? _i++ : _i--){ _results.push(_i); }
          return _results;
        }).apply(this));
      }
      rows = _.map(rows, function(row) {
        var cols, _j, _ref6, _results1;
        if (_.isNumber(row)) {
          row = $('<tr class="response-field-grid-row"></tr>').appendTo(table);
        }
        cols = $.makeArray($(row).find('td'));
        if (cols.length < numCols) {
          cols = cols.concat((function() {
            _results1 = [];
            for (var _j = _ref6 = cols.length; _ref6 <= numCols ? _j < numCols : _j > numCols; _ref6 <= numCols ? _j++ : _j--){ _results1.push(_j); }
            return _results1;
          }).apply(this));
        }
        cols = _.map(cols, function(col) {
          if (_.isNumber(col)) {
            return col = $('<td class="response-field-grid-cell"></td>').appendTo(row).html(Formbuilder.templates["view/element_selector"]());
          }
        });
        return row;
      });
      if (currentRows > numRows) {
        subelements = this.subelements();
        _.each(subelements, function(subelement) {
          var grid;
          grid = _this.parentView.gridAttr(subelement);
          if (grid.row > (numRows - 1)) {
            return subelement.destroy();
          }
        });
        table.find('tr').slice(numRows - currentRows).remove();
      }
      if (currentCols > numCols) {
        subelements = this.subelements();
        _.each(subelements, function(subelement) {
          var grid;
          grid = _this.parentView.gridAttr(subelement);
          if (grid.col > (numCols - 1)) {
            return subelement.destroy();
          }
        });
        return table.find('tr').find('td:gt(' + (numCols - 1) + ')').remove();
      }
    };

    GridFieldView.prototype.renderChildren = function() {
      var children,
        _this = this;
      children = this.model.get('children') || [];
      return _.each(children, function(child) {
        var grid;
        grid = child.options.grid;
        return _this.createField(child, _this.getSubelement(grid.row, grid.col));
      });
    };

    GridFieldView.prototype.focusEditView = function(e) {
      if ($(e.target).parents('table').length === 0) {
        return this.parentView.createAndShowEditView(this.model);
      }
    };

    GridFieldView.prototype.clear = function(e) {
      var cb, x,
        _this = this;
      e.preventDefault();
      e.stopPropagation();
      cb = function() {
        var subelements;
        _this.parentView.handleFormUpdate();
        subelements = _this.subelements();
        _.each(_this.subelements(), function(model) {
          model.destroy();
          return true;
        });
        return _this.model.destroy();
      };
      x = Formbuilder.options.CLEAR_FIELD_CONFIRM;
      switch (typeof x) {
        case 'string':
          if (confirm(x)) {
            return cb();
          }
          break;
        case 'function':
          return x(cb);
        default:
          return cb();
      }
    };

    GridFieldView.prototype.duplicate = function() {
      var attrs, children,
        _this = this;
      attrs = Formbuilder.helpers.clone(this.model.attributes);
      delete attrs['id'];
      delete attrs['cid'];
      attrs['uuid'] = uuid.v4();
      attrs['label'] += ' Copy';
      children = this.subelements();
      delete attrs['children'];
      this.parentView.createField(attrs, {
        position: -1
      });
      return attrs['children'] = _.map(children, function(child) {
        var childattrs;
        childattrs = Formbuilder.helpers.clone(child.attributes);
        delete childattrs['id'];
        delete childattrs['cid'];
        delete childattrs['uuid'];
        childattrs['parent_uuid'] = attrs['uuid'];
        childattrs;
        return _this.parentView.createField(childattrs, {
          position: -1
        });
      });
    };

    GridFieldView.prototype.addSubelement = function(model) {
      var grid, label;
      if (this.belongsToMe(model) && model.get('label').match(/Copy/)) {
        grid = this.parentView.gridAttr(model);
        label = model.get('label').match(/(.+) Copy/);
        if (label !== null) {
          return model.attributes.label = label[1] + ' ' + (grid.row + 1);
        } else {
          return model.attributes.label = 'Row: ' + (grid.row + 1) + ', Col: ' + (grid.col + 1);
        }
      }
    };

    GridFieldView.prototype.removeSubelement = function(model) {
      var belongsToMe, grid;
      grid = this.parentView.gridAttr(model);
      belongsToMe = this.belongsToMe(model);
      if (belongsToMe && this.getSubelement(grid.row, grid.col).html() === '') {
        return this.getSubelement(grid.row, grid.col).html(Formbuilder.templates["view/element_selector"]({
          rf: this.model
        }));
      }
    };

    GridFieldView.prototype.subelements = function() {
      var _this = this;
      return this.parentView.collection.filter(function(item) {
        return _this.belongsToMe(item);
      });
    };

    GridFieldView.prototype.belongsToMe = function(model) {
      return this.parentView.inGrid(model) && model.get('parent_uuid') === this.model.get('uuid');
    };

    GridFieldView.prototype.inlineAdd = function(e) {
      var target, type;
      e.preventDefault();
      e.stopPropagation();
      type = $(e.currentTarget).data('type');
      target = $(e.currentTarget).parents('.response-field-grid-cell');
      return this.createField(type, target);
    };

    GridFieldView.prototype.getSubelement = function(row, col) {
      row++;
      col++;
      return this.$el.find('tr:nth-child(' + row + ') td:nth-child(' + col + ')');
    };

    GridFieldView.prototype.createField = function(attrs, target) {
      if (_.isString(attrs)) {
        attrs = Formbuilder.helpers.defaultFieldAttrs(attrs);
      }
      attrs.options.grid = {
        col: target.prop('cellIndex'),
        row: target.parents('tr').prop('rowIndex')
      };
      attrs.parent_uuid = this.model.get('uuid');
      return this.parentView.createField(attrs, {
        $appendEl: target
      });
    };

    GridFieldView.insert = function(builder, view, responseField, _, options) {
      var append, col, row;
      if (!options.$appendEl) {
        row = responseField.get('options.grid.row');
        col = responseField.get('options.grid.col');
        append = builder.wrapperByUuid(responseField.get('parent_uuid'));
        append = append.find('tr:nth-child(' + (row + 1) + ') td:nth-child(' + (col + 1) + ')');
        if (append.length === 1) {
          options.$appendEl = append;
        }
      }
      return ViewFieldView.insert(builder, view, responseField, _, options);
    };

    return GridFieldView;

  })(Backbone.View);

  EditFieldView = (function(_super) {
    __extends(EditFieldView, _super);

    function EditFieldView() {
      _ref5 = EditFieldView.__super__.constructor.apply(this, arguments);
      return _ref5;
    }

    EditFieldView.prototype.className = "edit-response-field";

    EditFieldView.prototype.events = {
      'click .js-add-option': 'addOption',
      'click .js-remove-option': 'removeOption',
      'click .js-default-updated': 'defaultUpdated',
      'input .option-label-input': 'forceRender'
    };

    EditFieldView.prototype.initialize = function(options) {
      var _this = this;
      this.parentView = options.parentView;
      this.listenTo(this.model, "destroy", this.remove);
      return _.each(Formbuilder.options.change, function(callback, key) {
        var eventName;
        eventName = 'change:' + _.nested(Formbuilder.options.mappings, key);
        return _this.listenTo(_this.model, eventName, callback);
      });
    };

    EditFieldView.prototype.render = function() {
      this.$el.html(Formbuilder.templates["edit/base" + (!this.model.is_input() ? '_non_input' : '')]({
        rf: this.model
      }));
      rivets.bind(this.$el, {
        model: this.model
      });
      return this;
    };

    EditFieldView.prototype.reset = function() {
      this.parentView.editView = void 0;
      return this.parentView.createAndShowEditView(this.model);
    };

    EditFieldView.prototype.remove = function() {
      this.parentView.editView = void 0;
      this.parentView.$el.find("[data-target=\"#addField\"]").click();
      return EditFieldView.__super__.remove.apply(this, arguments);
    };

    EditFieldView.prototype.addOption = function(e) {
      var $el, i, newOption, options;
      $el = $(e.currentTarget);
      i = this.$el.find('.option').index($el.closest('.option'));
      options = this.model.get(Formbuilder.options.mappings.OPTIONS) || [];
      newOption = {
        uuid: uuid.v4(),
        label: "",
        checked: false
      };
      if (i > -1) {
        options.splice(i + 1, 0, newOption);
      } else {
        options.push(newOption);
      }
      this.model.set(Formbuilder.options.mappings.OPTIONS, options);
      this.model.trigger("change:" + Formbuilder.options.mappings.OPTIONS);
      return this.forceRender();
    };

    EditFieldView.prototype.removeOption = function(e) {
      var $el, index, options;
      $el = $(e.currentTarget);
      index = this.$el.find(".js-remove-option").index($el);
      options = this.model.get(Formbuilder.options.mappings.OPTIONS);
      options.splice(index, 1);
      this.model.set(Formbuilder.options.mappings.OPTIONS, options);
      this.model.trigger("change:" + Formbuilder.options.mappings.OPTIONS);
      return this.forceRender();
    };

    EditFieldView.prototype.defaultUpdated = function(e) {
      var $el;
      $el = $(e.currentTarget);
      if (this.model.get(Formbuilder.options.mappings.TYPE) !== 'checkboxes') {
        this.$el.find(".js-default-updated").not($el).attr('checked', false).trigger('change');
      }
      return this.forceRender();
    };

    EditFieldView.prototype.forceRender = function() {
      return this.model.trigger('change', this.model);
    };

    return EditFieldView;

  })(Backbone.View);

  BuilderView = (function(_super) {
    __extends(BuilderView, _super);

    function BuilderView() {
      _ref6 = BuilderView.__super__.constructor.apply(this, arguments);
      return _ref6;
    }

    BuilderView.prototype.SUBVIEWS = [];

    BuilderView.prototype.saveFormButton = $();

    BuilderView.prototype.events = {
      'click .js-save-form': 'saveForm',
      'click .fb-tabs a': 'showTab',
      'click .fb-add-types a': 'addField',
      'mouseover .fb-add-types': 'lockLeftWrapper',
      'mouseout .fb-add-types': 'unlockLeftWrapper'
    };

    BuilderView.prototype.initialize = function(options) {
      var selector;
      selector = options.selector, this.formBuilder = options.formBuilder, this.bootstrapData = options.bootstrapData;
      if (selector != null) {
        this.setElement($(selector));
      }
      this.collection = new FormbuilderCollection;
      this.collection.bind('add', this.addOne, this);
      this.collection.bind('reset', this.reset, this);
      this.collection.bind('change', this.handleFormUpdate, this);
      this.collection.bind('destroy add reset', this.hideShowNoResponseFields, this);
      this.collection.bind('destroy', this.ensureEditViewScrolled, this);
      this.render();
      this.collection.reset(this.bootstrapData);
      return this.bindSaveEvent();
    };

    BuilderView.prototype.bindSaveEvent = function() {
      var _this = this;
      this.formSaved = true;
      this.saveFormButton = this.$el.find(".js-save-form");
      this.saveFormButton.attr('disabled', true).text(Formbuilder.options.dict.ALL_CHANGES_SAVED);
      if (!!Formbuilder.options.AUTOSAVE) {
        setInterval(function() {
          return _this.saveForm.call(_this);
        }, 5000);
      }
      return $(window).bind('beforeunload', function() {
        if (_this.formSaved) {
          return void 0;
        } else {
          return Formbuilder.options.dict.UNSAVED_CHANGES;
        }
      });
    };

    BuilderView.prototype.reset = function() {
      this.$responseFields.html('');
      return this.addAll();
    };

    BuilderView.prototype.render = function() {
      var subview, _i, _len, _ref7;
      this.$el.html(Formbuilder.templates['page']());
      this.$fbLeft = this.$el.find('.fb-left');
      this.$responseFields = this.$el.find('.fb-response-fields');
      this.bindWindowScrollEvent();
      this.hideShowNoResponseFields();
      _ref7 = this.SUBVIEWS;
      for (_i = 0, _len = _ref7.length; _i < _len; _i++) {
        subview = _ref7[_i];
        new subview({
          parentView: this
        }).render();
      }
      return this;
    };

    BuilderView.prototype.bindWindowScrollEvent = function() {
      var _this = this;
      return $(window).on('scroll', function() {
        var maxMargin, newMargin;
        if (_this.$fbLeft.data('locked') === true) {
          return;
        }
        newMargin = Math.max(0, $(window).scrollTop() - _this.$el.offset().top);
        maxMargin = _this.$responseFields.height();
        return _this.$fbLeft.css({
          'margin-top': Math.min(maxMargin, newMargin)
        });
      });
    };

    BuilderView.prototype.showTab = function(e) {
      var $el, first_model, target;
      $el = $(e.currentTarget);
      target = $el.data('target');
      $el.closest('li').addClass('active').siblings('li').removeClass('active');
      $(target).addClass('active').siblings('.fb-tab-pane').removeClass('active');
      if (target !== '#editField') {
        this.unlockLeftWrapper();
      }
      if (target === '#editField' && !this.editView && (first_model = this.collection.models[0])) {
        return this.createAndShowEditView(first_model);
      }
    };

    BuilderView.prototype.createView = function(responseField) {
      var view;
      if (responseField.attributes.type === 'grid') {
        view = new GridFieldView({
          model: responseField,
          parentView: this
        });
      } else if (responseField.attributes.type === 'table') {
        view = new TableFieldView({
          model: responseField,
          parentView: this
        });
      } else {
        view = new ViewFieldView({
          model: responseField,
          parentView: this
        });
      }
      return view;
    };

    BuilderView.prototype.insert = function(view, responseField, _, options) {
      var inserted, parentModel, parentType, type;
      inserted = false;
      parentModel = responseField.parentModel();
      parentType = parentModel ? parentModel.get('type') : void 0;
      type = parentType || responseField.get('type');
      if (type === 'grid') {
        inserted = GridFieldView.insert(this, view, responseField, _, options);
      } else if (type === 'table') {
        inserted = TableFieldView.insert(this, view, responseField, _, options);
      }
      if (!inserted) {
        inserted = ViewFieldView.insert(this, view, responseField, _, options);
      }
      return inserted;
    };

    BuilderView.prototype.addOne = function(responseField, _, options) {
      var view;
      view = this.createView(responseField);
      this.$responseFields.find('> .ui-draggable').remove();
      if (responseField.get('model_only') !== true) {
        this.insert(view, responseField, _, options);
      }
      return this.views[responseField.get('uuid')] = view;
    };

    BuilderView.prototype.setSortable = function() {
      var _this = this;
      if (this.$responseFields.hasClass('ui-sortable')) {
        this.$responseFields.sortable('destroy');
      }
      this.$responseFields.sortable({
        forcePlaceholderSize: true,
        placeholder: 'sortable-placeholder',
        stop: function(e, ui) {
          var rf;
          if (ui.item.data('type')) {
            rf = _this.collection.create(Formbuilder.helpers.defaultFieldAttrs(ui.item.data('type')), {
              $replaceEl: ui.item
            });
            _this.createAndShowEditView(rf);
          }
          _this.handleFormUpdate();
          return true;
        },
        update: function(e, ui) {
          if (!ui.item.data('type')) {
            return _this.ensureEditViewScrolled();
          }
        }
      });
      return this.setDraggable();
    };

    BuilderView.prototype.setDraggable = function() {
      var $addFieldButtons,
        _this = this;
      $addFieldButtons = this.$el.find("[data-type]");
      return $addFieldButtons.draggable({
        connectToSortable: this.$responseFields,
        helper: function() {
          var $helper;
          $helper = $("<div class='response-field-draggable-helper' />");
          $helper.css({
            width: _this.$responseFields.width(),
            height: '80px'
          });
          return $helper;
        }
      });
    };

    BuilderView.prototype.addAll = function() {
      this.collection.each(function(item, _, collection) {
        return this.addOne.call(this, item, _, {});
      }, this);
      return this.setSortable();
    };

    BuilderView.prototype.hideShowNoResponseFields = function() {
      return this.$el.find(".fb-no-response-fields")[this.collection.length > 0 ? 'hide' : 'show']();
    };

    BuilderView.prototype.addField = function(e) {
      var type;
      type = $(e.currentTarget).data('type');
      return this.createField(Formbuilder.helpers.defaultFieldAttrs(type, {}));
    };

    BuilderView.prototype.createField = function(attrs, options) {
      var rf;
      rf = this.collection.create(attrs, options);
      this.createAndShowEditView(rf);
      return this.handleFormUpdate();
    };

    BuilderView.prototype.createAndShowEditView = function(model) {
      var $newEditEl, $responseFieldEl, fieldWrapper;
      $responseFieldEl = this.$el.find(".fb-field-wrapper").filter(function() {
        return $(this).data('cid') === model.cid;
      });
      $('.fb-field-wrapper').removeClass('editing');
      $responseFieldEl.addClass('editing');
      if (this.editView) {
        if (this.editView.model.cid === model.cid) {
          this.$el.find(".fb-tabs a[data-target=\"#editField\"]").click();
          this.scrollLeftWrapper($responseFieldEl);
          return;
        }
        this.editView.remove();
      }
      this.editView = new EditFieldView({
        model: model,
        parentView: this
      });
      $newEditEl = this.editView.render().$el;
      fieldWrapper = this.$el.find(".fb-edit-field-wrapper");
      fieldWrapper.html($newEditEl);
      if (this.inGrid(model)) {
        fieldWrapper.addClass('fb-edit-field-grid');
      } else {
        fieldWrapper.removeClass('fb-edit-field-grid');
      }
      if (model.inTable()) {
        $('.spectrum-colorpicker', ".fb-edit-field-wrapper").spectrum({
          allowEmpty: true,
          preferredFormat: 'hex',
          showPalette: true,
          showPaletteOnly: true,
          palette: ['#000000', '#424242', '#636363', '#9C9C94', '#CEC6CE', '#EFEFEF', '#F7F7F7', '#FFFFFF', '#FF0000', '#FF9C00', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#9C00FF', '#FF00FF', '#F7C6CE', '#FFE7CE', '#FFEFC6', '#D6EFD6', '#CEDEE7', '#CEE7F7', '#D6D6E7', '#E7D6DE', '#E79C9C', '#FFC69C', '#FFE79C', '#B5D6A5', '#A5C6CE', '#9CC6EF', '#B5A5D6', '#D6A5BD', '#E76363', '#F7AD6B', '#FFD663', '#94BD7B', '#73A5AD', '#6BADDE', '#8C7BC6', '#C67BA5', '#CE0000', '#E79439', '#EFC631', '#6BA54A', '#4A7B8C', '#3984C6', '#634AA5', '#A54A7B', '#9C0000', '#B56308', '#BD9400', '#397B21', '#104A5A', '#085294', '#311873', '#731842', '#630000', '#7B3900', '#846300', '#295218', '#083139', '#003163', '#21104A', '#4A1031']
        });
      }
      this.$el.find(".fb-tabs a[data-target=\"#editField\"]").click();
      this.scrollLeftWrapper($responseFieldEl);
      return this;
    };

    BuilderView.prototype.inGrid = function(model) {
      return this.hasParent(model) && model.get('options.grid');
    };

    BuilderView.prototype.inTable = function(model) {
      return this.hasParent(model) && model.get('options.table');
    };

    BuilderView.prototype.hasParent = function(model) {
      return model.get('parent_uuid');
    };

    BuilderView.prototype.modelByUuid = function(uuid) {
      return this.collection.findWhere({
        'uuid': uuid
      });
    };

    BuilderView.prototype.wrapperByUuid = function(uuid) {
      return $('.fb-field-wrapper').filter(function() {
        return $(this).data('uuid') === uuid;
      });
    };

    BuilderView.prototype.viewByUuid = function(uuid) {
      return this.views[uuid];
    };

    BuilderView.prototype.views = {};

    BuilderView.prototype.gridAttr = function(model) {
      if (this.inGrid(model)) {
        return model.get('options.grid');
      }
      return null;
    };

    BuilderView.prototype.ensureEditViewScrolled = function() {
      if (!this.editView) {
        return;
      }
      return this.scrollLeftWrapper($(".fb-field-wrapper.editing"));
    };

    BuilderView.prototype.scrollLeftWrapper = function($responseFieldEl) {
      var _this = this;
      this.unlockLeftWrapper();
      if (!$responseFieldEl[0]) {
        return;
      }
      return $.scrollWindowTo((this.$el.offset().top + $responseFieldEl.offset().top) - this.$responseFields.offset().top, 200, function() {
        return _this.lockLeftWrapper();
      });
    };

    BuilderView.prototype.lockLeftWrapper = function() {
      return this.$fbLeft.data('locked', true);
    };

    BuilderView.prototype.unlockLeftWrapper = function() {
      return this.$fbLeft.data('locked', false);
    };

    BuilderView.prototype.handleFormUpdate = function() {
      this.collection.sort();
      if (this.updatingBatch) {
        return;
      }
      this.formSaved = false;
      return this.saveFormButton.removeAttr('disabled').text(Formbuilder.options.dict.SAVE_FORM);
    };

    BuilderView.prototype.getPayload = function() {
      return JSON.stringify({
        fields: this.collection.toJSON()
      });
    };

    BuilderView.prototype.saveForm = function(e) {
      var payload;
      if (this.formSaved) {
        return;
      }
      this.formSaved = true;
      this.saveFormButton.attr('disabled', true).text(Formbuilder.options.dict.ALL_CHANGES_SAVED);
      this.collection.sort();
      payload = this.getPayload();
      if (Formbuilder.options.HTTP_ENDPOINT) {
        this.doAjaxSave(payload);
      }
      return this.formBuilder.trigger('save', payload);
    };

    BuilderView.prototype.doAjaxSave = function(payload) {
      var _this = this;
      return $.ajax({
        url: Formbuilder.options.HTTP_ENDPOINT,
        type: Formbuilder.options.HTTP_METHOD,
        data: payload,
        contentType: "application/json",
        success: function(data) {
          var datum, _i, _len, _ref7;
          _this.updatingBatch = true;
          for (_i = 0, _len = data.length; _i < _len; _i++) {
            datum = data[_i];
            if ((_ref7 = _this.collection.get(datum.cid)) != null) {
              _ref7.set({
                id: datum.id
              });
            }
            _this.collection.trigger('sync');
          }
          return _this.updatingBatch = void 0;
        }
      });
    };

    return BuilderView;

  })(Backbone.View);

  Formbuilder = (function() {
    Formbuilder.attrs = {};

    Formbuilder.instances = [];

    Formbuilder.attr = function(name, value) {
      if (value !== void 0) {
        Formbuilder.attrs[name] = value;
        _.each(this.instances, function(instance) {
          return instance.mainView.reset();
        });
      }
      if (Formbuilder.attrs[name] !== void 0) {
        return Formbuilder.attrs[name];
      } else {
        return void 0;
      }
    };

    Formbuilder.helpers = {
      defaultFieldAttrs: function(type) {
        var attrs, _base;
        attrs = {};
        attrs[Formbuilder.options.mappings.LABEL] = 'Untitled';
        attrs[Formbuilder.options.mappings.TYPE] = type;
        attrs[Formbuilder.options.mappings.REQUIRED] = false;
        attrs['options'] = {};
        return (typeof (_base = Formbuilder.fields[type]).defaultAttributes === "function" ? _base.defaultAttributes(attrs, Formbuilder) : void 0) || attrs;
      },
      simple_format: function(x) {
        return x != null ? x.replace(/\n/g, '<br />') : void 0;
      },
      clone: function(obj) {
        return JSON.parse(JSON.stringify(obj));
      }
    };

    Formbuilder.options = {
      BUTTON_CLASS_SELECTOR: 'fb-button btn btn-default',
      BUTTON_CLASS_ADD: 'fb-button btn btn-xs btn-primary',
      BUTTON_CLASS_REMOVE: 'fb-button btn btn-xs btn-danger',
      HTTP_ENDPOINT: '',
      HTTP_METHOD: 'POST',
      AUTOSAVE: false,
      CLEAR_FIELD_CONFIRM: false,
      ENABLED_FIELDS: ['text', 'checkbox', 'dropdown', 'textarea', 'radio', 'date', 'number', 'time', 'price', 'file', 'image', 'section'],
      mappings: {
        SIZE: 'options.size',
        INITIAL_VALUE: 'options.initial_value',
        INITIAL_DATE: 'options.initial_date',
        INITIAL_TIME: 'options.initial_time',
        UNITS: 'options.units',
        LABEL: 'label',
        NAME: 'definition.name',
        TYPE: 'type',
        REQUIRED: 'required',
        ADMIN_ONLY: 'admin_only',
        POPULATE_FROM: 'options.populate_from',
        POPULATE_UUID: 'options.populate_uuid',
        OPTIONS: 'answers',
        DESCRIPTION: 'description',
        INCLUDE_OTHER: 'options.include_other_option',
        INCLUDE_BLANK: 'options.include_blank_option',
        INCLUDE_SCORING: 'is_scored',
        INTEGER_ONLY: 'options.integer_only',
        LABEL_COLOR: 'options.label_color',
        LABEL_BACKGROUND_COLOR: 'options.label_background_color',
        READ_ONLY: 'options.read_only',
        COLUMN_WIDTH: 'options.column_width',
        DEFAULT_TIME: 'options.default_time',
        DEFAULT_DATE: 'options.default_date',
        NUMERIC: {
          CALCULATION_TYPE: 'options.calculation_type',
          CALCULATION_EXPRESSION: 'options.calculation_expression',
          CALCULATION_DISPLAY: 'options.calculation_display',
          TOTAL_SEQUENCE: 'options.total_sequence'
        },
        GRID: {
          COLS: 'options.cols',
          NUMCOLS: 'options.num_cols',
          ROWS: 'options.rows',
          NUMROWS: 'options.num_rows',
          FULL_WIDTH: 'options.full_width',
          FIRST_ROW_HEADINGS: 'options.first_row_headings'
        },
        TABLE: {
          COLS: 'options.cols',
          NUMCOLS: 'options.num_cols',
          ROWS: 'options.rows',
          INITIALROWS: 'options.initial_rows',
          MAXROWS: 'options.max_rows',
          FULL_WIDTH: 'options.full_width',
          COLUMNTOTALS: 'options.display_column_totals',
          ROWTOTALS: 'options.display_row_totals'
        },
        DATA_SOURCE: {
          MULTIPLE: 'options.multiple_selections',
          DATA_SOURCE: 'options.data_source',
          VALUE_TEMPLATE: 'options.value_template',
          REQUIRED_PROPERTIES: 'options.required_properties',
          FILTER: 'options.filter',
          FILTER_VALUES: 'options.filter_values',
          IS_FILTERED: 'options.is_filtered'
        },
        MIN: 'options.min',
        MAX: 'options.max',
        OPTIONS_PER_ROW: 'options.options_per_row',
        MINLENGTH: 'options.minlength',
        MAXLENGTH: 'options.maxlength',
        LENGTH_UNITS: 'options.min_max_length_units'
      },
      change: {
        INCLUDE_SCORING: function() {
          return this.reset();
        },
        POPULATE_UUID: function() {
          return this.reset();
        },
        'DATA_SOURCE.DATA_SOURCE': function() {
          return this.reset();
        },
        'DATA_SOURCE.IS_FILTERED': function() {
          return this.reset();
        },
        'DATA_SOURCE.FILTER': function() {
          return this.reset();
        }
      },
      dict: {
        ALL_CHANGES_SAVED: 'All changes saved',
        SAVE_FORM: 'Save form',
        UNSAVED_CHANGES: 'You have unsaved changes. If you leave this page, you will lose those changes!'
      }
    };

    Formbuilder.fields = {};

    Formbuilder.inputFields = {};

    Formbuilder.nonInputFields = {};

    Formbuilder.prototype.markSaved = function() {
      return this.mainView.formSaved = true;
    };

    Formbuilder.prototype.getPayload = function() {
      return this.mainView.getPayload();
    };

    Formbuilder.registerField = function(name, opts) {
      var enabled, x, _i, _len, _ref7;
      enabled = true;
      if (!_.contains(Formbuilder.options.ENABLED_FIELDS, name)) {
        enabled = false;
      }
      _ref7 = ['view', 'edit'];
      for (_i = 0, _len = _ref7.length; _i < _len; _i++) {
        x = _ref7[_i];
        opts[x] = enabled ? _.template(opts[x]) : function(x) {
          return '';
        };
      }
      opts.type = name;
      opts.enabled = enabled;
      Formbuilder.fields[name] = opts;
      if (opts.element_type === 'non_input') {
        return Formbuilder.nonInputFields[name] = opts;
      } else {
        return Formbuilder.inputFields[name] = opts;
      }
    };

    function Formbuilder(opts) {
      var args, partionedData;
      if (opts == null) {
        opts = {};
      }
      _.extend(this, Backbone.Events);
      args = _.extend(opts, {
        formBuilder: this
      });
      this.attrs = {};
      partionedData = _(args.bootstrapData || []).groupBy(function(i) {
        if (i.parent_uuid === void 0) {
          return 0;
        } else {
          return 1;
        }
      }).toArray().value();
      partionedData = _.reduce(partionedData, function(a, i) {
        return a.concat(i);
      });
      args.bootstrapData = _.map(partionedData, function(i) {
        return _.extend({}, Formbuilder.helpers.defaultFieldAttrs(i.type), i);
      });
      this.mainView = new BuilderView(args);
      this.mainView.collection;
      Formbuilder.instances.push(this);
    }

    return Formbuilder;

  })();

  if (_.nested === void 0) {
    _.mixin({
      'nested': function(obj, key) {
        if (obj && key) {
          return obj[key] || _.reduce(key.split('.'), function(obj, key) {
            if (obj) {
              return obj[key];
            } else {
              return void 0;
            }
          }, obj);
        } else {
          return void 0;
        }
      }
    });
  }

  window.Formbuilder = Formbuilder;

  window.FormbuilderModel = FormbuilderModel;

  if (typeof module !== "undefined" && module !== null) {
    module.exports = Formbuilder;
  } else {
    window.Formbuilder = Formbuilder;
  }

}).call(this);

(function() {
  Formbuilder.registerField('address', {
    name: 'Address',
    order: 50,
    view: "<div class='input-line'>\n  <span class='street'>\n    <input type='text' />\n    <label>Address</label>\n  </span>\n</div>\n\n<div class='input-line'>\n  <span class='city'>\n    <input type='text' />\n    <label>City</label>\n  </span>\n\n  <span class='state'>\n    <input type='text' />\n    <label>State / Province / Region</label>\n  </span>\n</div>\n\n<div class='input-line'>\n  <span class='zip'>\n    <input type='text' />\n    <label>Zipcode</label>\n  </span>\n\n  <span class='country'>\n    <select><option>United States</option></select>\n    <label>Country</label>\n  </span>\n</div>",
    edit: "",
    addButton: "<span class=\"fb-icon-address\"></span> Address"
  });

}).call(this);

(function() {
  Formbuilder.registerField('checkbox', {
    name: 'Checkboxes',
    order: 10,
    view: "<div class=\"fb-options-per-row-<%= rf.get(Formbuilder.options.mappings.OPTIONS_PER_ROW) %>\">\n    <% for (i in (rf.get(Formbuilder.options.mappings.OPTIONS) || [])) { %>\n      <div class=\"fb-option-wrapper\">\n        <label class='fb-option'>\n          <input type='checkbox' <%= rf.get(Formbuilder.options.mappings.OPTIONS)[i].checked && 'checked' %> onclick=\"javascript: return false;\" />\n          <%= rf.get(Formbuilder.options.mappings.OPTIONS)[i].label %>\n        </label>\n      </div>\n    <% } %>\n\n    <% if (rf.get(Formbuilder.options.mappings.INCLUDE_OTHER)) { %>\n      <div class='other-option'>\n        <label class='fb-option'>\n          <input type='checkbox' />\n          Other\n        </label>\n\n        <input type='text' />\n      </div>\n    <% } %>\n</div>",
    edit: "<%= Formbuilder.templates['edit/options']({ rf: rf }) %>\n<%= Formbuilder.templates['edit/options_per_row']({ rf: rf }) %>",
    addButton: "<span class=\"fb-icon-checkbox\"></span> Checkboxes",
    defaultAttributes: function(attrs) {
      attrs.answers = [
        {
          uuid: uuid.v4(),
          label: "",
          checked: false,
          score: false
        }, {
          uuid: uuid.v4(),
          label: "",
          checked: false,
          score: false
        }
      ];
      attrs.options.options_per_row = 1;
      return attrs;
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('datasource', {
    name: 'List',
    order: 70,
    view: "<select>\n  <option>\n     <%= rf.source().title %>\n     (<%= rf.sourceProperty(rf.get(Formbuilder.options.mappings.DATA_SOURCE.VALUE_TEMPLATE)) %>)\n  </option>\n</select>",
    edit: "<%= Formbuilder.templates['edit/data_source_options']({ rf: rf }) %>",
    addButton: "<span class=\"fb-icon-data-source\"></span> Data Source",
    defaultAttributes: function(attrs, formbuilder) {
      var datasources;
      attrs.initialize = function() {
        this.on("change", function(model) {
          var filters, sourceProperties, valueTemplate;
          filters = model.filters();
          if (_.nested(model, 'changed.options.data_source') !== void 0) {
            sourceProperties = _.keys(model.sourceProperties());
            model.set('options.required_properties', sourceProperties);
            valueTemplate = _.first(sourceProperties);
            model.set('options.value_template', valueTemplate);
          }
          if (filters) {
            return model.set('options.filter', _.first(_.keys(filters)));
          }
        });
        return this.on("destroy", function(model) {
          return this.collection.each(function(collectionModel) {
            if (collectionModel.get('options.populate_uuid') === model.get('uuid')) {
              collectionModel.set('options.populate_uuid', null);
              return collectionModel.set('options.populate_from', null);
            }
          });
        });
      };
      attrs.source = function() {
        var source, sources;
        source = this.options ? this.options.data_source : this.get(Formbuilder.options.mappings.DATA_SOURCE.DATA_SOURCE);
        sources = formbuilder.attr('sources');
        return _.nested(sources, source) || {};
      };
      attrs.sourceProperties = function() {
        var source;
        source = this.source();
        return _.nested(source, 'properties') || [];
      };
      attrs.filters = function() {
        var source;
        source = this.source();
        return _.nested(source, 'filters') || null;
      };
      attrs.currentFilter = function() {
        var source;
        source = this.source();
        return _.nested(source, 'filters.' + this.get('options.filter')) || {};
      };
      attrs.filterValues = function() {
        return this.currentFilter().values || {};
      };
      attrs.sourceProperty = function(property) {
        return this.sourceProperties()[property] || null;
      };
      attrs.options.multiple_selections = false;
      attrs.options.is_filtered = false;
      datasources = formbuilder.attr('sources') || {};
      attrs.options.data_source = _.keys(datasources)[0];
      attrs.options.required_properties = _.keys(attrs.sourceProperties(attrs.options.data_source));
      attrs.options.filter = null;
      attrs.options.filter_values = [];
      attrs.options.value_template = _.first(attrs.options.required_properties);
      return attrs;
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('date', {
    name: 'Date',
    order: 20,
    view: "<% var date = rf.get(Formbuilder.options.mappings.INITIAL_DATE), dateparts = date.split('-'); %>\n<div class='input-line'>\n  <span class='month'>\n    <input type=\"text\" value='<%= (dateparts[0] > 12 || dateparts[0] < 1) ? ((dateparts[0] > 12) ? '12' : '1') : dateparts[0] %>'/>\n    <label>MM</label>\n  </span>\n  <span class='above-line'>-</span>\n  <span class='day'>\n    <input type=\"text\" value=\"<%= (dateparts[1] > 31 || dateparts[1] < 1) ? ((dateparts[1] > 31) ? '31' : '1') : dateparts[1] %>\"/>\n    <label>DD</label>\n  </span>\n  <span class='above-line'>-</span>\n  <span class='year'>\n    <input type=\"text\" value=\"<%= (dateparts[2] < 1) ? '1' : dateparts[2] %>\"/>\n    <label>YYYY</label>\n  </span>\n</div>",
    edit: "<%= Formbuilder.templates['edit/initial_date']() %>",
    addButton: "<span class=\"fb-icon-date\"></span> Date",
    defaultAttributes: function(attrs) {
      attrs.options.initial_date = 'MM - DD - YYYY';
      return attrs;
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('dropdown', {
    name: 'Dropdown',
    order: 24,
    view: "<select>\n  <% if (rf.get(Formbuilder.options.mappings.INCLUDE_BLANK)) { %>\n    <option value=''></option>\n  <% } %>\n\n  <% for (i in (rf.get(Formbuilder.options.mappings.OPTIONS) || [])) { %>\n    <option <%= rf.get(Formbuilder.options.mappings.OPTIONS)[i].checked && 'selected' %>>\n      <%= rf.get(Formbuilder.options.mappings.OPTIONS)[i].label %>\n    </option>\n  <% } %>\n</select>",
    edit: "<%= Formbuilder.templates['edit/scoring']() %>\n<%= Formbuilder.templates['edit/options']({ rf: rf }) %>",
    addButton: "<span class=\"fb-icon-dropdown\"></span> Dropdown",
    defaultAttributes: function(attrs) {
      attrs.answers = [
        {
          uuid: uuid.v4(),
          label: "",
          checked: false,
          score: ""
        }, {
          uuid: uuid.v4(),
          label: "",
          checked: false,
          score: ""
        }
      ];
      attrs.is_scored = false;
      attrs.options.include_blank_option = false;
      return attrs;
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('email', {
    name: 'Email',
    order: 40,
    view: "<input type='text' class='rf-size-<%= rf.get(Formbuilder.options.mappings.SIZE) %>' />",
    edit: "",
    addButton: "<span class=\"icon-email\"></span> Email"
  });

}).call(this);

(function() {
  Formbuilder.registerField('file', {
    name: 'File',
    order: 55,
    view: "<input type='file' />",
    edit: "",
    addButton: "<span class=\"glyphicon glyphicon-paperclip\"></span> File"
  });

}).call(this);

(function() {
  Formbuilder.registerField('grid', {
    name: 'Layout Grid',
    order: 30,
    element_type: 'non_input',
    view: "<label class='section-name'><%= rf.get(Formbuilder.options.mappings.LABEL) %></label>\n<table class=\"response-field-grid-table\">\n</table>\n<p><%= rf.get(Formbuilder.options.mappings.DESCRIPTION) %></p>",
    edit: "<div class=\"fb-edit-section-header\">Details</div>\n<div class=\"fb-common-wrapper\">\n    <div class=\"fb-label-description\">\n      <input type=\"text\" data-rv-input=\"model.<%= Formbuilder.options.mappings.LABEL %>\">\n      <textarea data-rv-input=\"model.<%= Formbuilder.options.mappings.DESCRIPTION %>\" placeholder=\"Add a longer description to this field\">\n      </textarea>\n    </div>\n    <label class=\"checkbox\">\n       <input type='checkbox' data-rv-checked='model.<%= Formbuilder.options.mappings.GRID.FULL_WIDTH %>' /> Display full width?\n    </label>\n    <label class=\"checkbox\">\n       <input type='checkbox' data-rv-checked='model.<%= Formbuilder.options.mappings.GRID.FIRST_ROW_HEADINGS%>' /> First row headings?\n    </label>\n    <div class='fb-edit-section-header'>Number of Columns</div>\n      <select data-rv-value=\"model.<%= Formbuilder.options.mappings.GRID.NUMCOLS %>\">\n          <option value=\"1\">1</option>\n          <option value=\"2\">2</option>\n          <option value=\"3\">3</option>\n          <option value=\"4\">4</option>\n          <option value=\"5\">5</option>\n          <option value=\"6\">6</option>\n          <option value=\"7\">7</option>\n          <option value=\"8\">8</option>\n          <option value=\"9\">9</option>\n          <option value=\"10\">10</option>\n      </select>\n    <div class='fb-edit-section-header'>Number of Rows</div>\n      <select data-rv-value=\"model.<%= Formbuilder.options.mappings.GRID.NUMROWS %>\">\n          <option value=\"1\">1</option>\n          <option value=\"2\">2</option>\n          <option value=\"3\">3</option>\n          <option value=\"4\">4</option>\n          <option value=\"5\">5</option>\n          <option value=\"6\">6</option>\n          <option value=\"7\">7</option>\n          <option value=\"8\">8</option>\n          <option value=\"9\">9</option>\n          <option value=\"10\">10</option>\n          <option value=\"11\">11</option>\n          <option value=\"12\">12</option>\n          <option value=\"13\">13</option>\n          <option value=\"14\">14</option>\n          <option value=\"15\">15</option>\n          <option value=\"16\">16</option>\n          <option value=\"17\">17</option>\n          <option value=\"18\">18</option>\n          <option value=\"19\">19</option>\n          <option value=\"20\">20</option>\n      </select>\n    </div>\n</div>",
    addButton: "<span class=\"fb-icon-grid\"></span> Grid",
    defaultAttributes: function(attrs) {
      attrs.options.num_cols = 1;
      attrs.options.num_rows = 1;
      attrs.options.full_width = false;
      attrs.options.first_row_headings = false;
      attrs.children = [];
      attrs.childModels = function() {
        return this.collection.filter(function(model) {
          return _.indexOf(this.get('options.elements'), model.get('uuid')) !== -1;
        }, this);
      };
      return attrs;
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('image', {
    name: 'Image',
    order: 65,
    view: "<input type='file' />",
    edit: "",
    addButton: "<span class=\"glyphicon glyphicon-picture\"></span> Image"
  });

}).call(this);

(function() {
  Formbuilder.registerField('info', {
    name: 'Info',
    order: 20,
    element_type: 'non_input',
    view: "<label class='section-name'><%= rf.get(Formbuilder.options.mappings.LABEL) %></label>\n<p><%= rf.get(Formbuilder.options.mappings.DESCRIPTION) %></p>",
    edit: "<div class=\"fb-edit-section-header\">Details</div>\n<div class=\"fb-common-wrapper\">\n  <div class=\"fb-label-description\">\n    <input type=\"text\" data-rv-input=\"model.<%= Formbuilder.options.mappings.LABEL %>\">\n  </div>\n  <textarea class=\"fb-info-editor\" style=\"display:none;\" data-rv-input=\"model.<%= Formbuilder.options.mappings.DESCRIPTION %>\">\n  </textarea>\n</div>",
    addButton: "<span class=\"fb-icon-info\"></span> Info",
    onEdit: function(model) {
      var update;
      update = function() {
        model.set(Formbuilder.options.mappings.DESCRIPTION, $(this).code());
        return model.trigger('change:' + Formbuilder.options.mappings.DESCRIPTION);
      };
      return $('.fb-info-editor').summernote({
        onChange: function() {
          return update.call(this);
        },
        onKeyup: function() {
          return update.call(this);
        },
        toolbar: [['style', ['bold', 'italic', 'underline']], ['fontsize', ['fontsize']], ['color', ['color']], ['insert', ['link']], ['table', ['table']], ['misc', ['codeview']]]
      });
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('number', {
    name: 'Number',
    order: 30,
    view: "<input type='text' class=\"calculated\" value=\"<%= rf.get(Formbuilder.options.mappings.NUMERIC.CALCULATION_DISPLAY) %>\" <%= rf.get(Formbuilder.options.mappings.NUMERIC.CALCULATION_DISPLAY) ? 'readonly=\"readonly\"' : ''  %> />\n<% if (units = rf.get(Formbuilder.options.mappings.UNITS)) { %>\n  <%= units %>\n<% } %>",
    edit: "<%= Formbuilder.templates['edit/initial_value']() %>\n<%= Formbuilder.templates['edit/total']({rf:rf}) %>\n<%= Formbuilder.templates['edit/min_max']({rf:rf}) %>",
    addButton: "<span class=\"fb-icon-number\"></span> Number",
    defaultAttributes: function(attrs, formbuilder) {
      attrs.insertion = function() {
        var parentModel, totalColumn;
        parentModel = this.parentModel();
        if (parentModel && parentModel.get('type') === 'table') {
          totalColumn = parentModel.totalColumn(this.get('uuid'));
          return this.attributes.options.total_sequence = totalColumn;
        }
      };
      attrs.initialize = function() {
        this.on("change", function(model) {
          var totalSequence;
          if (_.nested(model, 'changed.options.calculation_type') !== void 0) {
            model.expression();
          }
          if (_.nested(model, 'changed.options.total_sequence') !== void 0) {
            totalSequence = _.nested(model, 'changed.options.total_sequence');
            this.parentModel().totalColumn(model.get('uuid'), totalSequence);
          }
          return model;
        });
        return this.on("change", function(model) {
          if (_.nested(model, 'changed.options.min') !== void 0) {
            model.validatemin();
          }
          if (_.nested(model, 'changed.options.max') !== void 0) {
            model.validatemax();
          }
          return model;
        });
      };
      attrs.validatemin = function() {
        var max, min;
        min = parseInt(this.get('options.min'));
        max = parseInt(this.get('options.max'));
        if (isNaN(min)) {
          this.set('options.min', 0);
        }
        if (min > max) {
          this.set('options.min', max);
        }
        if (isNaN(max)) {
          return this.set('options.max', 500);
        }
      };
      attrs;
      attrs.validatemax = function() {
        var max, min;
        min = parseInt(this.get('options.min'));
        max = parseInt(this.get('options.max'));
        if (isNaN(max)) {
          this.set('options.max', 0);
        }
        console.log(min);
        console.log(max);
        if (max < min) {
          return this.set('options.min', 0);
        }
      };
      attrs;
      attrs.numericSiblings = function() {
        var parentModel;
        parentModel = this.parentModel();
        if (parentModel) {
          return _.filter(parentModel.childModels(), function(i) {
            return i.get('type') === 'number' && i.get('uuid') !== this.get('uuid');
          }, this);
        } else {
          return [];
        }
      };
      attrs.expression = function() {
        var calculation_type, numericSiblings, operator;
        calculation_type = this.get('options.calculation_type');
        if (calculation_type !== '') {
          operator = calculation_type === 'SUM' ? '+' : '*';
          numericSiblings = this.numericSiblings();
          this.set('options.calculation_expression', _.map(numericSiblings, function(model) {
            return 'uuid_' + model.get('uuid').replace(/-/g, '_');
          }).join(operator));
          this.set('options.calculation_display', '= ' + _.map(numericSiblings, function(model) {
            return model.get('label');
          }).join(operator));
          return console.log(this.get('options.calculation_expression'));
        } else {
          this.set('options.calculation_expression', '');
          return this.set('options.calculation_display', '');
        }
      };
      attrs.canTotalColumn = function() {
        var parent;
        parent = this.parentModel();
        return parent && parent.get('type') === 'table';
      };
      attrs.canAcceptCalculatedTotal = function() {
        return this.numericSiblings().length > 1;
      };
      return attrs;
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('price', {
    name: 'Price',
    order: 45,
    view: "<div class='input-line'>\n  <span class='above-line'>PKR</span>\n  <span class='dolars'>\n    <input type='text' />\n    <!--<label>PKR</label>-->\n  </span>\n</div>",
    edit: "",
    addButton: "<span class=\"glyphicon glyphicon-usd\"></span> Price"
  });

}).call(this);

(function() {
  Formbuilder.registerField('radio', {
    name: 'Radio Button',
    order: 15,
    view: "<div class=\"fb-options-per-row-<%= rf.get(Formbuilder.options.mappings.OPTIONS_PER_ROW) %>\">\n    <% for (i in (rf.get(Formbuilder.options.mappings.OPTIONS) || [])) { %>\n      <div class=\"fb-option-wrapper\">\n        <label class='fb-option'>\n          <input type='radio' <%= rf.get(Formbuilder.options.mappings.OPTIONS)[i].checked && 'checked' %> onclick=\"javascript: return false;\" />\n          <%= rf.get(Formbuilder.options.mappings.OPTIONS)[i].label %>\n        </label>\n      </div>\n    <% } %>\n\n    <% if (rf.get(Formbuilder.options.mappings.INCLUDE_OTHER)) { %>\n      <div class='fb-option-wrapper other-option'>\n        <label class='fb-option'>\n          <input type='radio' />\n          Other\n        </label>\n\n        <input type='text' />\n      </div>\n    <% } %>\n</div>",
    edit: "<%= Formbuilder.templates['edit/scoring']({ rf: rf }) %>\n<%= Formbuilder.templates['edit/options']({ rf: rf }) %>\n<%= Formbuilder.templates['edit/options_per_row']({ rf: rf }) %>",
    addButton: "<span class=\"fb-icon-radio\"></span> Multiple Choice",
    defaultAttributes: function(attrs) {
      attrs.answers = [
        {
          uuid: uuid.v4(),
          label: "",
          checked: false,
          score: ""
        }, {
          uuid: uuid.v4(),
          label: "",
          checked: false,
          score: ""
        }
      ];
      attrs.is_scored = false;
      attrs.options.options_per_row = 1;
      return attrs;
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('section', {
    name: 'Section',
    order: 70,
    view: "<label class='section-name'><%= rf.get(Formbuilder.options.mappings.LABEL) %></label>\n<p><%= rf.get(Formbuilder.options.mappings.DESCRIPTION) %></p>",
    edit: "<div class=\"fb-edit-section-header\">Details</div>\n<div class=\"fb-common-wrapper\">\n<div class=\"fb-label-description\">\n  <input type=\"text\" data-rv-input=\"model.<%= Formbuilder.options.mappings.LABEL %>\">\n  <textarea data-rv-input=\"model.<%= Formbuilder.options.mappings.DESCRIPTION %>\" placeholder=\"Add a longer description to this field\">\n  </textarea>\n</div>\n</div>",
    addButton: "<span class=\"fb-icon-section\"></span> Section Break"
  });

}).call(this);

(function() {
  Formbuilder.registerField('signature', {
    name: 'Signature',
    order: 65,
    view: "<div class=\"fb-signature form-control\">\n    <div class=\"fb-signature-placeholder\">Sign Here</div>\n    <div class=\"fb-signature-pad\"></div>\n</div>\n<button class=\"btn btn-default btn-xs\">Clear</button>",
    edit: "",
    addButton: "<span class=\"fb-icon-signature\"></span> Signature"
  });

}).call(this);

(function() {
  Formbuilder.registerField('table', {
    name: 'Table',
    order: 0,
    element_type: 'non_input',
    view: "<label class='section-name'><%= rf.get(Formbuilder.options.mappings.LABEL) %></label>\n<%= Formbuilder.templates[\"view/table_field\"]({rf: rf}) %>\n<p><%= rf.get(Formbuilder.options.mappings.DESCRIPTION) %></p>",
    edit: "<div class='fb-edit-section-header'>Details</div>\n<div class='fb-common-wrapper'>\n  <div class='fb-label-description'>\n    <%= Formbuilder.templates['edit/label_description']({rf: rf}) %>\n  </div>\n  <div class='fb-clear'></div>\n</div>\n<label class=\"checkbox\">\n  <input type='checkbox' data-rv-checked='model.<%= Formbuilder.options.mappings.GRID.FULL_WIDTH %>' /> Display full width ?\n</label>",
    addButton: "<span class=\"fb-icon-table\"></span> Table",
    defaultAttributes: function(attrs) {
      attrs.options.full_width = false;
      attrs.initialize = function() {
        var parent;
        parent = this;
        return _.each(this.childModels, function(childModel) {
          return childModel.on("change", function(model) {
            if (_.nested(model, 'changed.options.column_width') !== void 0) {
              parent.columnWidth(model.get('uuid'), model.get('options.column_width'));
            }
            return model;
          });
        });
      };
      attrs.childModels = function() {
        var elementsUuids;
        elementsUuids = _.pluck(this.get('options.elements'), 'uuid');
        return this.collection.filter(function(model) {
          return _.indexOf(elementsUuids, model.get('uuid')) !== -1;
        }, this);
      };
      attrs.elementOptions = function(elementUuid) {
        return _.findWhere(this.get('options.elements'), {
          uuid: elementUuid
        });
      };
      attrs.createTotalColumnModel = function(parentUuid) {
        var totalColumnModel;
        totalColumnModel = new FormbuilderModel(Formbuilder.helpers.defaultFieldAttrs('number'));
        totalColumnModel.set('options.calculation_expression', 'sum(column_uuid_' + parentUuid.replace(/-/g, '_') + ')');
        totalColumnModel.set('model_only', true);
        totalColumnModel.set('parent_uuid', parentUuid);
        this.collection.add(totalColumnModel);
        return totalColumnModel;
      };
      attrs.columnWidth = function(elementUuid, width) {
        var elements;
        elements = this.get('options.elements');
        return _.each(elements, function(element, index) {
          if (element.uuid === elementUuid) {
            return elements[index].columnWidth = width;
          }
        }, this);
      };
      attrs.totalColumn = function(elementUuid, value) {
        var elements;
        elements = this.get('options.elements');
        if (value !== void 0) {
          _.each(elements, function(element, index) {
            var totalColumnModel;
            if (element.uuid === elementUuid) {
              if (element.totalColumnUuid === void 0) {
                totalColumnModel = this.createTotalColumnModel(element.uuid);
                elements[index].totalColumnUuid = totalColumnModel.get('uuid');
              }
              return elements[index].totalColumn = value;
            }
          }, this);
          return this.set('options.elements', elements);
        } else {
          if (this.elementOptions(elementUuid)) {
            return this.elementOptions(elementUuid).totalColumn || false;
          } else {
            return false;
          }
        }
      };
      return attrs;
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('text', {
    name: 'Short Answer',
    order: 0,
    view: "<% var initial_value = rf.get(Formbuilder.options.mappings.INITIAL_VALUE); %>\n<input type='text' value='<%= initial_value %>' class='rf-size-<%= rf.get(Formbuilder.options.mappings.SIZE) %>' />",
    edit: "<% var minlength = rf.get(Formbuilder.options.mappings.MINLENGTH); %>\n<% var maxlength = rf.get(Formbuilder.options.mappings.MAXLENGTH); %>\n\n<%= Formbuilder.templates['edit/initial_value']() %>\n<%= Formbuilder.templates['edit/min_max_length']({ rf: rf }) %>",
    addButton: "<span class=\"fb-icon-text\"></span> Text",
    defaultAttributes: function(attrs, formbuilder) {
      attrs.initialize = function() {
        return this.on("change", function(model) {
          if (_.nested(model, 'changed.options.minlength') !== void 0) {
            model.validatemin();
          }
          if (_.nested(model, 'changed.options.maxlength') !== void 0) {
            model.validatemax();
          }
          return model;
        });
      };
      attrs.validatemin = function() {
        var maxlength, minlength;
        minlength = parseInt(this.get('options.minlength'));
        maxlength = parseInt(this.get('options.maxlength'));
        if (isNaN(minlength)) {
          this.set('options.minlength', 0);
        }
        if (minlength > maxlength) {
          this.set('options.minlength', maxlength);
        }
        if (isNaN(maxlength)) {
          return this.set('options.maxlength', 500);
        }
      };
      attrs;
      attrs.validatemax = function() {
        var maxlength, minlength;
        minlength = parseInt(this.get('options.minlength'));
        maxlength = parseInt(this.get('options.maxlength'));
        if (isNaN(maxlength)) {
          this.set('options.maxlength', 0);
        }
        console.log(minlength);
        console.log(maxlength);
        if (maxlength < minlength) {
          return this.set('options.minlength', 0);
        }
      };
      return attrs;
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('textarea', {
    name: 'Long Answer',
    order: 5,
    view: "<textarea class='rf-size-<%= rf.get(Formbuilder.options.mappings.SIZE) %>'></textarea>",
    edit: "<%= Formbuilder.templates['edit/populate_from']({ rf: rf }) %>",
    addButton: "<span class=\"fb-icon-textarea\"></span> Paragraph",
    defaultAttributes: function(attrs) {
      attrs.options.size = 'small';
      return attrs;
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('time', {
    order: 25,
    view: "<% var time = rf.get(Formbuilder.options.mappings.INITIAL_TIME), timeparts = time.split(/[ :]+/); %>\n<div class='input-line'>\n  <span class='hours'>\n    <input type=\"text\" value='<%= (timeparts[0] > 12 || timeparts[0] < 1) ? ((timeparts[0] > 12) ? '12' : '1') : timeparts[0] %>'/>\n    <label>HH</label>\n  </span>\n  <span class='above-line'>:</span>\n  <span class='minutes'>\n    <input type=\"text\" value='<%= (timeparts[1] > 60 || timeparts[1] < 0) ? ((timeparts[1] > 60) ? '60' : '0') : timeparts[1] %>'/>\n    <label>MM</label>\n  </span>\n  <span class='above-line'>:</span>\n  <span class='seconds'>\n    <input type=\"text\" value='<%= (timeparts[2] > 60 || timeparts[2] < 0) ? ((timeparts[2] > 60) ? '60' : '0') : timeparts[2] %>'/>\n    <label>SS</label>\n  </span>\n  <span class='am_pm'>\n    <select>\n      <option <%= (timeparts[3] == 'AM') ? 'selected=\"selected\"' : '' %> >AM</option>\n      <option <%= (timeparts[3] == 'PM') ? 'selected=\"selected\"' : '' %> >PM</option>\n    </select>\n  </span>\n</div>",
    edit: "<%= Formbuilder.templates['edit/initial_time']() %>",
    addButton: "<span class=\"symbol\"><span class=\"fb-icon-time\"></span></span> Time",
    defaultAttributes: function(attrs) {
      attrs.options.initial_time = 'HH:MM:SS AA';
      return attrs;
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('website', {
    name: 'Website',
    order: 35,
    view: "<input type='text' placeholder='http://' />",
    edit: "",
    addButton: "<span class=\"fb-icon-website\"></span> Website"
  });

}).call(this);

this["Formbuilder"] = this["Formbuilder"] || {};
this["Formbuilder"]["templates"] = this["Formbuilder"]["templates"] || {};

this["Formbuilder"]["templates"]["edit/base"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p +=
((__t = ( Formbuilder.templates['edit/base_header']({rf: rf}) )) == null ? '' : __t) +
'\n' +
((__t = ( Formbuilder.templates['edit/common']({rf: rf}) )) == null ? '' : __t) +
'\n' +
((__t = ( Formbuilder.fields[rf.get(Formbuilder.options.mappings.TYPE)].edit({rf: rf}) )) == null ? '' : __t) +
'\n' +
((__t = ( Formbuilder.templates['edit/columnwidth']({rf: rf}) )) == null ? '' : __t) +
'\n' +
((__t = ( Formbuilder.templates['edit/table_color']({rf: rf}) )) == null ? '' : __t) +
'\n';

}
return __p
};

this["Formbuilder"]["templates"]["edit/base_header"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class=\'fb-field-label\'>\n  <span data-rv-text="model.' +
((__t = ( Formbuilder.options.mappings.LABEL )) == null ? '' : __t) +
'"></span>\n  <code class=\'type\' data-rv-text=\'model.' +
((__t = ( Formbuilder.options.mappings.NAME )) == null ? '' : __t) +
'\'></code>\n  <span class=\'fa fa-arrow-right pull-right\'></span>\n</div>\n';

}
return __p
};

this["Formbuilder"]["templates"]["edit/base_non_input"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p +=
((__t = ( Formbuilder.templates['edit/base_header']({rf: rf}) )) == null ? '' : __t) +
'\n' +
((__t = ( Formbuilder.fields[rf.get(Formbuilder.options.mappings.TYPE)].edit({rf: rf}) )) == null ? '' : __t) +
'\n';

}
return __p
};

this["Formbuilder"]["templates"]["edit/checkboxes"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<label class="checkbox">\n  <input type=\'checkbox\' data-rv-checked=\'model.' +
((__t = ( Formbuilder.options.mappings.REQUIRED )) == null ? '' : __t) +
'\' />\n  Required\n</label>\n';

}
return __p
};

this["Formbuilder"]["templates"]["edit/columnwidth"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<!-- <div class=\'fb-edit-section-header\'>Column width</div>\n\nWidth in px\n<input class="form-control" type="number" data-rv-input="model.' +
((__t = ( Formbuilder.options.mappings.COLUMN_WIDTH )) == null ? '' : __t) +
'" style="width: 50px" />\n\n -->';

}
return __p
};

this["Formbuilder"]["templates"]["edit/common"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class=\'fb-edit-section-header\'>Details</div>\n\n<div class=\'fb-common-wrapper\'>\n  <div class=\'fb-label-description\'>\n    ' +
((__t = ( Formbuilder.templates['edit/label_description']({rf: rf}) )) == null ? '' : __t) +
'\n  </div>\n  <div class=\'fb-common-checkboxes\'>\n    ' +
((__t = ( Formbuilder.templates['edit/checkboxes']() )) == null ? '' : __t) +
'\n  </div>\n  <div class=\'fb-clear\'></div>\n</div>';

}
return __p
};

this["Formbuilder"]["templates"]["edit/data_source_options"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '<div class=\'fb-edit-section-header\'>Data Source</div>\n<select data-rv-value="model.' +
((__t = ( Formbuilder.options.mappings.DATA_SOURCE.DATA_SOURCE )) == null ? '' : __t) +
'">\n';
 for (i in (Formbuilder.attr('sources') || [])) { ;
__p += '\n    <option value="' +
((__t = ( i )) == null ? '' : __t) +
'">\n    ' +
((__t = ( Formbuilder.attr('sources')[i].title )) == null ? '' : __t) +
'\n    </option>\n';
 } ;
__p += '\n</select>\n<div class=\'fb-edit-section-header\'>Display</div>\n<select data-rv-value="model.' +
((__t = ( Formbuilder.options.mappings.DATA_SOURCE.VALUE_TEMPLATE )) == null ? '' : __t) +
'">\n';

    for (i in (rf.sourceProperties() || [])) { ;
__p += '\n    <option value="' +
((__t = ( i )) == null ? '' : __t) +
'">\n    ' +
((__t = ( rf.sourceProperties()[i] )) == null ? '' : __t) +
'\n    </option>\n';
 } ;
__p += '\n</select>\n';
 if (rf.filters()) { ;
__p += '\n    <div class=\'fb-edit-section-header\'> Filter </div>\n    <label class="checkbox">\n      <input type=\'checkbox\' class="js-scoring"  data-rv-checked=\'model.' +
((__t = ( Formbuilder.options.mappings.DATA_SOURCE.IS_FILTERED )) == null ? '' : __t) +
'\' />\n      Apply a filter?\n    </label>\n    ';
 if (rf.get(Formbuilder.options.mappings.DATA_SOURCE.IS_FILTERED)) { ;
__p += '\n    <select data-rv-value="model.' +
((__t = ( Formbuilder.options.mappings.DATA_SOURCE.FILTER )) == null ? '' : __t) +
'">\n    ';

        for (i in (rf.filters() || [])) { ;
__p += '\n        <option value="' +
((__t = ( i )) == null ? '' : __t) +
'">\n        ' +
((__t = ( rf.filters()[i].name )) == null ? '' : __t) +
'\n        </option>\n    ';
 } ;
__p += '\n    </select>\n    ';

    for (i in rf.filterValues()) { ;
__p += '\n        <label class="checkbox">\n          <input type=\'checkbox\' data-rv-append=\'model.' +
((__t = ( Formbuilder.options.mappings.DATA_SOURCE.FILTER_VALUES )) == null ? '' : __t) +
'\' value="' +
((__t = ( i )) == null ? '' : __t) +
'" />\n            ' +
((__t = ( rf.filterValues()[i] )) == null ? '' : __t) +
'\n        </label>\n    ';
 } ;
__p += '\n';
 } ;
__p += '\n';
 } ;


}
return __p
};

this["Formbuilder"]["templates"]["edit/date"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class="fb-default-date-wrapper">\n    <label class="checkbox">\n        <input class="default-date" type=\'checkbox\' data-rv-checked=\'model.' +
((__t = ( Formbuilder.options.mappings.DEFAULT_DATE )) == null ? '' : __t) +
'\' />\n        Default to current date\n    </label>\n</div>\n';

}
return __p
};

this["Formbuilder"]["templates"]["edit/initial_date"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class=\'fb-edit-section-header\'>Initial Date (MM-DD-YYYY)</div>\n<input type=\'text\' id="default_date" data-rv-input=\'model.' +
((__t = ( Formbuilder.options.mappings.INITIAL_DATE )) == null ? '' : __t) +
'\' />\n<script >\n\n    $(document).ready(function(){\n     $("#default_date").inputmask("99-99-9999");  //static mask\n    });\n\n</script>';

}
return __p
};

this["Formbuilder"]["templates"]["edit/initial_time"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class=\'fb-edit-section-header\'>Initial Time(HH:MM:SS PM)</div>\n<input type=\'text\' id="default_time" data-rv-input=\'model.' +
((__t = ( Formbuilder.options.mappings.INITIAL_TIME )) == null ? '' : __t) +
'\' />\n<script >\n\n    $(document).ready(function(){\n     $("#default_time").inputmask("99:99:99 AA");  //static mask\n    });\n\n</script>';

}
return __p
};

this["Formbuilder"]["templates"]["edit/initial_value"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class=\'fb-edit-section-header\'>Initial value</div>\n<input type=\'text\' data-rv-input=\'model.' +
((__t = ( Formbuilder.options.mappings.INITIAL_VALUE )) == null ? '' : __t) +
'\' />';

}
return __p
};

this["Formbuilder"]["templates"]["edit/integer_only"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<label class="checkbox">\n  <input type=\'checkbox\' data-rv-checked=\'model.' +
((__t = ( Formbuilder.options.mappings.INTEGER_ONLY )) == null ? '' : __t) +
'\' />\n  Whole numbers only?\n</label>\n';

}
return __p
};

this["Formbuilder"]["templates"]["edit/label_description"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<input type=\'text\' class="form-control" data-rv-input=\'model.' +
((__t = ( Formbuilder.options.mappings.LABEL )) == null ? '' : __t) +
'\' />\n<textarea class="form-control" data-rv-input=\'model.' +
((__t = ( Formbuilder.options.mappings.DESCRIPTION )) == null ? '' : __t) +
'\'\n  placeholder=\'Add a longer description to this field\'></textarea>';

}
return __p
};

this["Formbuilder"]["templates"]["edit/min_max"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class=\'fb-edit-section-header\'>Minimum / Maximum</div>\n\nMax\n<input type="number" data-rv-input="model.' +
((__t = ( Formbuilder.options.mappings.MAX )) == null ? '' : __t) +
'" style="width: 100px" />\n\n&nbsp;&nbsp;\n\nMin\n<input type="number" data-rv-input="model.' +
((__t = ( Formbuilder.options.mappings.MIN )) == null ? '' : __t) +
'" style="width: 100px" />\n';

}
return __p
};

this["Formbuilder"]["templates"]["edit/min_max_length"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class=\'fb-edit-section-header\'>Length Limit (characters)</div>\n\n\nMax\n<input class="form-control" type="number" data-rv-input="model.' +
((__t = ( Formbuilder.options.mappings.MAXLENGTH )) == null ? '' : __t) +
'" style="width: 100px" />\n&nbsp;\nMin\n<input class="form-control" type="number" data-rv-input="model.' +
((__t = ( Formbuilder.options.mappings.MINLENGTH )) == null ? '' : __t) +
'" style="width: 100px" />\n\n\n\n\n<!--&nbsp;\n\n<select class="form-control" data-rv-value="model.' +
((__t = ( Formbuilder.options.mappings.LENGTH_UNITS )) == null ? '' : __t) +
'" style="width: 100px;">\n  <option value="characters">characters</option>\n  <option value="words">words</option>\n</select>-->\n';

}
return __p
};

this["Formbuilder"]["templates"]["edit/options"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '<div class=\'fb-edit-section-header\'>Options</div>\n\n';
 if (typeof includeBlank !== 'undefined'){ ;
__p += '\n  <label class="checkbox">\n    <input type=\'checkbox\' data-rv-checked=\'model.' +
((__t = ( Formbuilder.options.mappings.INCLUDE_BLANK )) == null ? '' : __t) +
'\' />\n    Include blank\n  </label>\n';
 } ;
__p += '\n\n<div class=\'option\' data-rv-each-option=\'model.' +
((__t = ( Formbuilder.options.mappings.OPTIONS )) == null ? '' : __t) +
'\'>\n<!--   <input type="checkbox" class=\'js-default-updated\' data-rv-checked="option:checked" /> -->\n  <input type="text" data-rv-input="option:label" placeholder="Label" class=\'option-label-input\' />\n  ';
 if (rf.get(Formbuilder.options.mappings.INCLUDE_SCORING)) { ;
__p += '\n  <input type="text" data-rv-input="option:score" placeholder="Score" class=\'option-score-input\' />\n  ';
 } ;
__p += '\n\n  <button class="js-remove-option ' +
((__t = ( Formbuilder.options.BUTTON_CLASS_REMOVE )) == null ? '' : __t) +
'" title="Remove Option"><span class=\'glyphicon glyphicon-minus\'></span></button>\n</div>\n\n';
 if (typeof includeOther !== 'undefined'){ ;
__p += '\n  <label class="checkbox">\n    <input type=\'checkbox\' data-rv-checked=\'model.' +
((__t = ( Formbuilder.options.mappings.INCLUDE_OTHER )) == null ? '' : __t) +
'\' />\n    Include "other"\n  </label>\n';
 } ;
__p += '\n\n<div class=\'fb-bottom-add\'>\n  <button class="js-add-option ' +
((__t = ( Formbuilder.options.BUTTON_CLASS_ADD )) == null ? '' : __t) +
'">Add option</button>\n</div>\n';

}
return __p
};

this["Formbuilder"]["templates"]["edit/options_per_row"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class=\'fb-edit-section-header\'>Number of options per row</div>\n    <select data-rv-value="model.' +
((__t = ( Formbuilder.options.mappings.OPTIONS_PER_ROW )) == null ? '' : __t) +
'">\n        <option value="1">1</option>\n        <option value="2">2</option>\n        <option value="3">3</option>\n        <option value="4">4</option>\n        <option value="5">5</option>\n        <option value="6">6</option>\n        <option value="7">7</option>\n        <option value="8">8</option>\n        <option value="9">9</option>\n        <option value="10">10</option>\n        <option value="11">11</option>\n        <option value="12">12</option>\n        <option value="13">13</option>\n        <option value="14">14</option>\n        <option value="15">15</option>\n    </select>\n</div>';

}
return __p
};

this["Formbuilder"]["templates"]["edit/populate_from"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {

  var list = rf.collection.findDataSourceFields();
if (list.length) { ;
__p += '\n    <div class=\'fb-edit-section-header\'>Populate From</div>\n    <select data-rv-value="model.' +
((__t = ( Formbuilder.options.mappings.POPULATE_UUID )) == null ? '' : __t) +
'">\n    <option>\n    ';

        for (i in (list || [])) { ;
__p += '\n        <option value="' +
((__t = ( list[i].get('uuid') )) == null ? '' : __t) +
'">\n        ' +
((__t = ( list[i].get('label') )) == null ? '' : __t) +
'\n        </option>\n    ';
 } ;
__p += '\n    </select>\n    <select data-rv-value="model.' +
((__t = ( Formbuilder.options.mappings.POPULATE_FROM )) == null ? '' : __t) +
'">\n    <option>\n    ';

        var populationUuid = rf.get('options.populate_uuid');
        var populationModel = rf.collection.findWhereUuid(populationUuid) || {};
        if (populationUuid && populationModel) {
            var dataSource = populationModel.get('options.data_source');
            var listProperties = Formbuilder.attr('sources')[dataSource].properties;
            for (i in listProperties) { ;
__p += '\n            <option value="' +
((__t = ( i )) == null ? '' : __t) +
'">\n            ' +
((__t = ( listProperties[i] )) == null ? '' : __t) +
'\n            </option>\n    ';
  }
    } ;
__p += '\n    </select>\n';
 } ;
__p += '\n';

}
return __p
};

this["Formbuilder"]["templates"]["edit/scoring"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class="fb-scoring-wrapper">\n    <label class="checkbox">\n      <input class="js-scoring" type=\'checkbox\' data-rv-checked=\'model.' +
((__t = ( Formbuilder.options.mappings.INCLUDE_SCORING )) == null ? '' : __t) +
'\' />\n      Include Scoring\n    </label>\n</div>\n\n';

}
return __p
};

this["Formbuilder"]["templates"]["edit/size"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class=\'fb-edit-section-header\'>Size</div>\n<select data-rv-value="model.' +
((__t = ( Formbuilder.options.mappings.SIZE )) == null ? '' : __t) +
'">\n  <option value="small">Small</option>\n  <option value="medium">Medium</option>\n  <option value="large">Large</option>\n</select>\n';

}
return __p
};

this["Formbuilder"]["templates"]["edit/table_color"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {

 if (rf.inTable()) { ;
__p += '\n<div class="fb-label-color">\n    <div class=\'fb-edit-section-header\'>Header Label Colour</div>\n    <div>\n        <input type=\'hidden\' class="form-control spectrum-colorpicker" id="fb-label-color"\n               data-rv-value=\'model.' +
((__t = ( Formbuilder.options.mappings.LABEL_COLOR )) == null ? '' : __t) +
'\'/>\n    </div>\n    <div class=\'fb-edit-section-header\'>Header Background Colour</div>\n    <div>\n        <input type=\'hidden\' class="form-control spectrum-colorpicker" id="fb-label-background-color"\n               data-rv-value=\'model.' +
((__t = ( Formbuilder.options.mappings.LABEL_BACKGROUND_COLOR )) == null ? '' : __t) +
'\'/>\n    </div>\n</div>\n';
 } ;


}
return __p
};

this["Formbuilder"]["templates"]["edit/table_layout"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class=\'fb-edit-section-header\'>Layout</div>\n    <label>\n        Columns\n        <select data-rv-value="model.' +
((__t = ( Formbuilder.options.mappings.TABLE.NUMCOLS )) == null ? '' : __t) +
'">\n            <option value="1">1</option>\n            <option value="2">2</option>\n            <option value="3">3</option>\n            <option value="4">4</option>\n            <option value="5">5</option>\n            <option value="6">6</option>\n            <option value="7">7</option>\n            <option value="8">8</option>\n            <option value="9">9</option>\n            <option value="10">10</option>\n        </select>\n    </label>\n\n    <label>\n        Max rows\n        <input type="text" data-rv-input="model.' +
((__t = ( Formbuilder.options.mappings.TABLE.MAXROWS )) == null ? '' : __t) +
'" style="width: 40px" />\n    </label>\n</div>';

}
return __p
};

this["Formbuilder"]["templates"]["edit/table_totals"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class=\'fb-edit-section-header\'>Totals</div>\n    <label>\n      <input type=\'checkbox\' data-rv-checked=\'model.' +
((__t = ( Formbuilder.options.mappings.TABLE.COLUMNTOTALS )) == null ? '' : __t) +
'\' />\n      Display column totals?\n    </label>\n</div>';

}
return __p
};

this["Formbuilder"]["templates"]["edit/time"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class="fb-default-time-wrapper">\n    <label class="checkbox">\n        <input class="default-time" type=\'checkbox\' data-rv-checked=\'model.' +
((__t = ( Formbuilder.options.mappings.DEFAULT_TIME )) == null ? '' : __t) +
'\' />\n        Default to current time\n    </label>\n</div>\n';

}
return __p
};

this["Formbuilder"]["templates"]["edit/total"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {

 if (rf.canTotalColumn()) { ;
__p += '\n<label class="checkbox">\n    Display column total?\n    <input type="checkbox" class=\'js-default-updated\' data-rv-checked=\'model.' +
((__t = ( Formbuilder.options.mappings.NUMERIC.TOTAL_SEQUENCE )) == null ? '' : __t) +
'\' />\n</label>\n';
 } ;
__p += '\n';
 if (rf.canAcceptCalculatedTotal()) { ;
__p += '\n<div class=\'fb-edit-section-header\'>Total</div>\n<label>\n    Calculated Value\n    <select data-rv-value="model.' +
((__t = ( Formbuilder.options.mappings.NUMERIC.CALCULATION_TYPE )) == null ? '' : __t) +
'">\n        <option value="">No Calculation</option>\n        <option value="SUM">Sum</option>\n        <option value="PRODUCT">Product</option>\n    </select>\n</label>\n';
 } ;
__p += '\n\n';

}
return __p
};

this["Formbuilder"]["templates"]["edit/units"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class=\'fb-edit-section-header\'>Units</div>\n<input type="text" data-rv-input="model.' +
((__t = ( Formbuilder.options.mappings.UNITS )) == null ? '' : __t) +
'" />\n';

}
return __p
};

this["Formbuilder"]["templates"]["page"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p +=
((__t = ( Formbuilder.templates['partials/save_button']() )) == null ? '' : __t) +
'\n' +
((__t = ( Formbuilder.templates['partials/left_side']() )) == null ? '' : __t) +
'\n' +
((__t = ( Formbuilder.templates['partials/right_side']() )) == null ? '' : __t) +
'\n<div class=\'fb-clear\'></div>';

}
return __p
};

this["Formbuilder"]["templates"]["partials/add_field"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '<div class=\'fb-tab-pane active\' id=\'addField\'>\n  <div class=\'fb-add-types\'>\n    <div class=\'section\'>\n      ';
 _.chain(Formbuilder.inputFields)
          .sortBy('order')
          .filter(function(f){ return f.enabled; })
          .each(function(f){ ;
__p += '\n        <a data-type="' +
((__t = ( f.type )) == null ? '' : __t) +
'" class="' +
((__t = ( Formbuilder.options.BUTTON_CLASS_SELECTOR )) == null ? '' : __t) +
'">\n          ' +
((__t = ( f.addButton )) == null ? '' : __t) +
'\n        </a>\n      ';
 }); ;
__p += '\n    </div>\n\n    <div class=\'section\'>\n      ';
 _.chain(Formbuilder.nonInputFields)
          .sortBy('order')
          .filter(function(f){ return f.enabled; })
          .each(function(f){ ;
__p += '\n        <a data-type="' +
((__t = ( f.type )) == null ? '' : __t) +
'" class="' +
((__t = ( Formbuilder.options.BUTTON_CLASS_SELECTOR )) == null ? '' : __t) +
'">\n          ' +
((__t = ( f.addButton )) == null ? '' : __t) +
'\n        </a>\n      ';
 }); ;
__p += '\n    </div>\n  </div>\n</div>';

}
return __p
};

this["Formbuilder"]["templates"]["partials/edit_field"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class=\'fb-tab-pane\' id=\'editField\'>\n  <div class=\'fb-edit-field-wrapper\'></div>\n</div>\n';

}
return __p
};

this["Formbuilder"]["templates"]["partials/left_side"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class=\'fb-left\'>\n  <ul class=\'fb-tabs\'>\n    <li class=\'active\'><a data-target=\'#addField\'>Add new field</a></li>\n    <li><a data-target=\'#editField\'>Edit field</a></li>\n  </ul>\n\n  <div class=\'fb-tab-content\'>\n    ' +
((__t = ( Formbuilder.templates['partials/add_field']() )) == null ? '' : __t) +
'\n    ' +
((__t = ( Formbuilder.templates['partials/edit_field']() )) == null ? '' : __t) +
'\n  </div>\n</div>';

}
return __p
};

this["Formbuilder"]["templates"]["partials/right_side"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class=\'fb-right panel\'>\n  <div class=\'fb-no-response-fields\'>No response fields</div>\n  <div class=\'fb-response-fields panel-body\'></div>\n</div>\n';

}
return __p
};

this["Formbuilder"]["templates"]["partials/save_button"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class=\'fb-save-wrapper\'>\n  <button class=\'js-save-form ' +
((__t = ( Formbuilder.options.BUTTON_CLASS )) == null ? '' : __t) +
'\'></button>\n</div>';

}
return __p
};

this["Formbuilder"]["templates"]["view/base"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class=\'subtemplate-wrapper\'>\n  <div class=\'cover\'></div>\n  ' +
((__t = ( Formbuilder.templates['view/label']({rf: rf}) )) == null ? '' : __t) +
'\n\n  ' +
((__t = ( Formbuilder.fields[rf.get(Formbuilder.options.mappings.TYPE)].view({rf: rf}) )) == null ? '' : __t) +
'\n\n  ' +
((__t = ( Formbuilder.templates['view/description']({rf: rf}) )) == null ? '' : __t) +
'\n  ' +
((__t = ( Formbuilder.templates['view/duplicate_remove']({rf: rf}) )) == null ? '' : __t) +
'\n</div>\n';

}
return __p
};

this["Formbuilder"]["templates"]["view/base_non_input"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class=\'subtemplate-wrapper\'>\n  <div class=\'cover\'></div>\n  ' +
((__t = ( Formbuilder.fields[rf.get(Formbuilder.options.mappings.TYPE)].view({rf: rf}) )) == null ? '' : __t) +
'\n  ' +
((__t = ( Formbuilder.templates['view/duplicate_remove']({rf: rf}) )) == null ? '' : __t) +
'\n</div>\n';

}
return __p
};

this["Formbuilder"]["templates"]["view/description"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<span class=\'help-block\'>\n  ' +
((__t = ( Formbuilder.helpers.simple_format(rf.get(Formbuilder.options.mappings.DESCRIPTION)) )) == null ? '' : __t) +
'\n</span>\n';

}
return __p
};

this["Formbuilder"]["templates"]["view/duplicate_remove"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class=\'actions-wrapper\'>\n  <button class="js-duplicate ' +
((__t = ( Formbuilder.options.BUTTON_CLASS_ADD )) == null ? '' : __t) +
'" title="Duplicate Field"><span class="glyphicon glyphicon-plus"></span></button>\n  <button class="js-clear ' +
((__t = ( Formbuilder.options.BUTTON_CLASS_REMOVE )) == null ? '' : __t) +
'" title="Remove Field"><span class="glyphicon glyphicon-minus"></span></button>\n</div>';

}
return __p
};

this["Formbuilder"]["templates"]["view/element_selector"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class="element-selector btn-group">\n<button type="button" class="btn btn-primary dropdown-toggle btn-sm" data-toggle="dropdown">\n    <span class="glyphicon glyphicon-plus"></span>\n</button>\n<ul class="dropdown-menu pull-right" role="menu">\n    <li data-type="text"><span class="fb-icon-text"></span> Text</li>\n    <li data-type="number"><span class="fb-icon-number"></span> Number</li>\n    <li data-type="textarea"><span class="fb-icon-textarea"></span> Paragraph</li>\n    <li data-type="info"><span class="fb-icon-info"></span> Info</li>\n    <li role="presentation" class="divider"></li>\n    <li data-type="dropdown"><span class="fb-icon-dropdown"></span> Dropdown</li>\n    <li data-type="radio"><span class="fb-icon-radio"></span> Radio</li>\n    <li data-type="checkbox"><span class="fb-icon-checkbox"></span> Multiple Choice</li>\n    <li data-type="datasource"><span class="fb-icon-data-source"></span> Data Source</li>\n    <li role="presentation" class="divider"></li>\n    <li data-type="date"><span class="fb-icon-date"></span> Date</li>\n    <li data-type="time"><span class="fb-icon-time"></span> Time</li>\n    <li data-type="signature"><span class="fb-icon-signature"></span> Signature</li>\n</ul>\n</div>';

}
return __p
};

this["Formbuilder"]["templates"]["view/label"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '<label>\n  <span style="color: ' +
((__t = ( rf.get(Formbuilder.options.mappings.LABEL_COLOR) || '#000' )) == null ? '' : __t) +
'">' +
((__t = ( Formbuilder.helpers.simple_format(rf.get(Formbuilder.options.mappings.LABEL)) )) == null ? '' : __t) +
'\n  ';
 if (rf.get(Formbuilder.options.mappings.REQUIRED)) { ;
__p += '\n    <abbr title=\'required\'>*</abbr>\n  ';
 } ;
__p += '\n</label>\n';

}
return __p
};

this["Formbuilder"]["templates"]["view/remove"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class=\'actions-wrapper\'>\n  <button class="js-clear ' +
((__t = ( Formbuilder.options.BUTTON_CLASS_REMOVE )) == null ? '' : __t) +
'" title="Remove Field"><span class="glyphicon glyphicon-minus"></span></button>\n</div>';

}
return __p
};

this["Formbuilder"]["templates"]["view/table_element"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p +=
((__t = ( Formbuilder.fields[rf.get(Formbuilder.options.mappings.TYPE)].view({rf: rf}) )) == null ? '' : __t) +
'\n' +
((__t = ( Formbuilder.templates['view/remove']({rf: rf}) )) == null ? '' : __t);

}
return __p
};

this["Formbuilder"]["templates"]["view/table_field"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '<span class="drop-area">\n' +
((__t = ( Formbuilder.templates['view/element_selector']() )) == null ? '' : __t) +
'\n</span>\n<table class="response-field-table">\n\n     <tbody>\n        <tr>\n            ';
 for (i in (rf.get('options.elements') || [])) { ;
__p += '\n            <td width="' +
((__t = ( rf.get('options.elements')[i].width )) == null ? '' : __t) +
'" data-uuid="' +
((__t = ( rf.get('options.elements')[i].uuid )) == null ? '' : __t) +
'" class="fb-field-wrapper subtemplate-wrapper header header-' +
((__t = ( rf.get('options.elements')[i].uuid )) == null ? '' : __t) +
'"></td>\n            ';
 } ;
__p += '\n        </tr>\n        <tr>\n            ';
 for (i in (rf.get('options.elements') || [])) { ;
__p += '\n            <td width="' +
((__t = ( rf.get('options.elements')[i].width )) == null ? '' : __t) +
'" data-uuid="' +
((__t = ( rf.get('options.elements')[i].uuid )) == null ? '' : __t) +
'" class="fb-field-wrapper subtemplate-wrapper element element-' +
((__t = ( rf.get('options.elements')[i].uuid )) == null ? '' : __t) +
'"></td>\n            ';
 } ;
__p += '\n        </tr>\n    </tbody>\n    <tfoot>\n        <tr>\n            ';
 for (i in (rf.get('options.elements') || [])) { ;
__p += '\n            <td width="' +
((__t = ( rf.get('options.elements')[i].width )) == null ? '' : __t) +
'" data-uuid="' +
((__t = ( rf.get('options.elements')[i].uuid )) == null ? '' : __t) +
'" class="fb-field-wrapper subtemplate-wrapper total total-' +
((__t = ( rf.get('options.elements')[i].uuid )) == null ? '' : __t) +
'"></td>\n            ';
 } ;
__p += '\n        </tr>\n    </tfoot>\n</table>';

}
return __p
};

this["Formbuilder"]["templates"]["view/table_header"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p +=
((__t = ( Formbuilder.templates['view/label']({rf: rf}) )) == null ? '' : __t) +
'\n' +
((__t = ( Formbuilder.templates['view/description']({rf: rf}) )) == null ? '' : __t);

}
return __p
};

this["Formbuilder"]["templates"]["view/table_total"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {

 if (rf.get('options.total_sequence')) { ;
__p += '\n<span class="calculated">(Column Total)</span>\n';
 } ;


}
return __p
};