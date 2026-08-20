/*================================================

Snake Game — DOM/CSS renderer.
Основано на "Snake Game - CSS Renderer" (Jack Rugile, CodePen: bGRWbK).
Логика и структура — почти без изменений, поправлено только:
  - цвета змейки/еды под палитру сайта
  - border-radius клеток/змейки/еды — 4px вместо динамических углов
  - .padding уменьшен до 0, чтобы поле занимало весь экран
  - убрана мёртвая строка с marginTop (ссылалась на не существующий
    headerHeight, реального эффекта не имела)
  - к уже существовавшим в оригинале, но нигде не подключавшимся
    методам upOn/downOn/leftOn/rightOn/*Off добавлена привязка
    к D-pad кнопкам и свайпам для мобильных

================================================*/

/*================================================

Polyfill

================================================*/

(function(){ 'use strict';

  var lastTime = 0;
  var vendors = [ 'webkit', 'moz' ];
  for( var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x ) {
    window.requestAnimationFrame = window[ vendors[ x ] + 'RequestAnimationFrame' ];
    window.cancelAnimationFrame = window[ vendors[ x ] + 'CancelAnimationFrame' ] || window[ vendors[ x ] + 'CancelRequestAnimationFrame' ];
  }

  if( !window.requestAnimationFrame ) {
    window.requestAnimationFrame = function( callback, element ) {
      var currTime = new Date().getTime();
      var timeToCall = Math.max( 0, 16 - ( currTime - lastTime ) );
      var id = window.setTimeout(
        function() {
          callback( currTime + timeToCall );
        }, timeToCall );
      lastTime = currTime + timeToCall;
      return id;
    }
  }

  if( !window.cancelAnimationFrame ) {
    window.cancelAnimationFrame = function( id ) {
      clearTimeout( id );
    }
  }

})();

/*================================================

Core

================================================*/

g = {};

(function(){ 'use strict';

  g.m = Math;
  g.mathProps = 'E LN10 LN2 LOG2E LOG10E PI SQRT1_2 SQRT2 abs acos asin atan ceil cos exp floor log round sin sqrt tan atan2 pow max min'.split( ' ' );
  for ( var i = 0; i < g.mathProps.length; i++ ) {
    g[ g.mathProps[ i ] ] = g.m[ g.mathProps[ i ] ];
  }
  g.m.TWO_PI = g.m.PI * 2;

  g.isset = function( prop ) {
    return typeof prop != 'undefined';
  };

  g.log = function() {
    if( g.isset( g.config ) && g.config.debug && window.console ){
      console.log( Array.prototype.slice.call( arguments ) );
    }
  };

})();

/*================================================

Group

================================================*/

(function(){ 'use strict';

  g.Group = function() {
    this.collection = [];
    this.length = 0;
  };

  g.Group.prototype.add = function( item ) {
    this.collection.push( item );
    this.length++;
  };

  g.Group.prototype.remove = function( index ) {
    if( index < this.length ) {
      this.collection.splice( index, 1 );
      this.length--;
    }
  };

  g.Group.prototype.empty = function() {
    this.collection.length = 0;
    this.length = 0;
  };

  g.Group.prototype.each = function( action, asc ) {
    var asc = asc || 0,
      i;
    if( asc ) {
      for( i = 0; i < this.length; i++ ) {
        this.collection[ i ][ action ]( i );
      }
    } else {
      i = this.length;
      while( i-- ) {
        this.collection[ i ][ action ]( i );
      }
    }
  };

})();

/*================================================

Utilities

================================================*/

(function(){ 'use strict';

  g.util = {};

  g.util.rand = function( min, max ) {
    return g.m.random() * ( max - min ) + min;
  };

  g.util.randInt = function( min, max ) {
    return g.m.floor( g.m.random() * ( max - min + 1) ) + min;
  };

}());

/*================================================

State

================================================*/

(function(){ 'use strict';

  g.states = {};

  g.addState = function( state ) {
    g.states[ state.name ] = state;
  };

  g.setState = function( name ) {
    if( g.state ) {
      g.states[ g.state ].exit();
    }
    g.state = name;
    g.states[ g.state ].init();
  };

  g.currentState = function() {
    return g.states[ g.state ];
  };

}());

/*================================================

Time

================================================*/

(function(){ 'use strict';

  g.Time = function() {
    this.reset();
  }

  g.Time.prototype.reset = function() {
    this.now = Date.now();
    this.last = Date.now();
    this.delta = 60;
    this.ndelta = 1;
    this.elapsed = 0;
    this.nelapsed = 0;
    this.tick = 0;
  };

  g.Time.prototype.update = function() {
    this.now = Date.now();
    this.delta = this.now - this.last;
    this.ndelta = Math.min( Math.max( this.delta / ( 1000 / 60 ), 0.0001 ), 10 );
    this.elapsed += this.delta;
    this.nelapsed += this.ndelta;
    this.last = this.now;
    this.tick++;
  };

})();

/*================================================

Grid Entity

================================================*/

(function(){ 'use strict';

  g.Grid = function( cols, rows ) {
    this.cols = cols;
    this.rows = rows;
    this.tiles = [];
    for( var x = 0; x < cols; x++ ) {
      this.tiles[ x ] = [];
      for( var y = 0; y < rows; y++ ) {
        this.tiles[ x ].push( 'empty' );
      }
    }
  };

  g.Grid.prototype.get = function( x, y ) {
    return this.tiles[ x ][ y ];
  };

  g.Grid.prototype.set = function( x, y, val ) {
    this.tiles[ x ][ y ] = val;
  };

})();

/*================================================

Board Tile Entity

================================================*/

(function(){ 'use strict';

  g.BoardTile = function( opt ) {
    this.parentState = opt.parentState;
    this.parentGroup = opt.parentGroup;
    this.col = opt.col;
    this.row = opt.row;
    this.x = opt.x;
    this.y = opt.y;
    this.z = 0;
    this.w = opt.w;
    this.h = opt.h;
    this.elem = document.createElement( 'div' );
    this.elem.style.position = 'absolute';
    this.elem.className = 'tile';
    this.parentState.stageElem.appendChild( this.elem );
    this.classes = {
      pressed: 0,
      path: 0,
      up: 0,
      down: 0,
      left: 0,
      right: 0
    }
    this.updateDimensions();
  };

  g.BoardTile.prototype.update = function() {
    for( var k in this.classes ) {
      if( this.classes[ k ] ) {
        this.classes[ k ]--;
      }
    }

    if( this.parentState.food.tile.col == this.col || this.parentState.food.tile.row == this.row ) {
      this.classes.path = 1;
      if( this.col < this.parentState.food.tile.col ) {
        this.classes.right = 1;
      } else {
        this.classes.right = 0;
      }
      if( this.col > this.parentState.food.tile.col ) {
        this.classes.left = 1;
      } else {
        this.classes.left = 0;
      }
      if( this.row > this.parentState.food.tile.row ) {
        this.classes.up = 1;
      } else {
        this.classes.up = 0;
      }
      if( this.row < this.parentState.food.tile.row ) {
        this.classes.down = 1;
      } else {
        this.classes.down = 0;
      }
    } else {
      this.classes.path = 0;
    }

    if( this.parentState.food.eaten ) {
      this.classes.path = 0;
    }
  };

  g.BoardTile.prototype.updateDimensions = function() {
    this.x = this.col * this.parentState.tileWidth;
    this.y = this.row * this.parentState.tileHeight;
    this.w = this.parentState.tileWidth - this.parentState.spacing;
    this.h = this.parentState.tileHeight - this.parentState.spacing;
    this.elem.style.left = this.x + 'px';
    this.elem.style.top = this.y + 'px';
    this.elem.style.width = this.w + 'px';
    this.elem.style.height = this.h + 'px';
  };

  g.BoardTile.prototype.render = function() {
    var classString = '';
    for( var k in this.classes ) {
      if( this.classes[ k ] ) {
        classString += k + ' ';
      }
    }
    this.elem.className = 'tile ' + classString;
  };

})();

/*================================================

Snake Tile Entity

================================================*/

(function(){ 'use strict';

  g.SnakeTile = function( opt ) {
    this.parentState = opt.parentState;
    this.parentGroup = opt.parentGroup;
    this.col = opt.col;
    this.row = opt.row;
    this.x = opt.x;
    this.y = opt.y;
    this.w = opt.w;
    this.h = opt.h;
    this.color = null;
    this.scale = 1;
    this.rotation = 0;
    this.blur = 0;
    this.alpha = 1;
    this.elem = document.createElement( 'div' );
    this.elem.style.position = 'absolute';
    this.elem.style.borderRadius = '4px';
    this.parentState.stageElem.appendChild( this.elem );
  };

  g.SnakeTile.prototype.update = function( i ) {
    this.x = this.col * this.parentState.tileWidth;
    this.y = this.row * this.parentState.tileHeight;
    if( i == 0 ) {
      this.blur = this.parentState.dimAvg * 0.03 + Math.sin( this.parentState.time.elapsed / 200 ) * this.parentState.dimAvg * 0.015;
    } else {
      this.blur = 0;
    }
    this.alpha = 1 - ( i / this.parentState.snake.tiles.length ) * 0.6;
    this.rotation = ( this.parentState.snake.justAteTick / this.parentState.snake.justAteTickMax ) * 90;
    this.scale = 1 + ( this.parentState.snake.justAteTick / this.parentState.snake.justAteTickMax ) * 1;
  };

  g.SnakeTile.prototype.updateDimensions = function() {
    this.w = this.parentState.tileWidth - this.parentState.spacing;
    this.h = this.parentState.tileHeight - this.parentState.spacing;
  };

  g.SnakeTile.prototype.render = function( i ) {
    this.elem.style.left = this.x + 'px';
    this.elem.style.top = this.y + 'px';
    this.elem.style.width = this.w + 'px';
    this.elem.style.height = this.h + 'px';
    this.elem.style.backgroundColor = 'rgba(85, 245, 247, ' + this.alpha + ')';
    this.elem.style.boxShadow = '0 0 ' + this.blur + 'px #55F5F7';
  };

})();

/*================================================

Food Tile Entity

================================================*/

(function(){ 'use strict';

  g.FoodTile = function( opt ) {
    this.parentState = opt.parentState;
    this.parentGroup = opt.parentGroup;
    this.col = opt.col;
    this.row = opt.row;
    this.x = opt.x;
    this.y = opt.y;
    this.w = opt.w;
    this.h = opt.h;
    this.blur = 0;
    this.scale = 1;
    this.opacity = 0;
    this.elem = document.createElement( 'div' );
    this.elem.style.position = 'absolute';
    this.elem.style.borderRadius = '4px';
    this.parentState.stageElem.appendChild( this.elem );
  };

  g.FoodTile.prototype.update = function() {
    this.x = this.col * this.parentState.tileWidth;
    this.y = this.row * this.parentState.tileHeight;
    this.blur = this.parentState.dimAvg * 0.03 + Math.sin( this.parentState.time.elapsed / 200 ) * this.parentState.dimAvg * 0.015;
    this.scale = 0.8 + Math.sin( this.parentState.time.elapsed / 200 ) * 0.2;

    if( this.parentState.food.birthTick || this.parentState.food.deathTick ) {
      if( this.parentState.food.birthTick ) {
        this.opacity = 1 - ( this.parentState.food.birthTick / 1 ) * 1;
      } else {
        this.opacity = ( this.parentState.food.deathTick / 1 ) * 1;
      }
    } else {
      this.opacity = 1;
    }
  };

  g.FoodTile.prototype.updateDimensions = function() {
    this.w = this.parentState.tileWidth - this.parentState.spacing;
    this.h = this.parentState.tileHeight - this.parentState.spacing;
  };

  g.FoodTile.prototype.render = function() {
    this.elem.style.left = this.x + 'px';
    this.elem.style.top = this.y + 'px';
    this.elem.style.width = this.w + 'px';
    this.elem.style.height = this.h + 'px';
    this.elem.style[ 'transform' ] = 'translateZ(0) scale(' + this.scale + ')';
    this.elem.style.backgroundColor = '#FB4EF8';
    this.elem.style.boxShadow = '0 0 ' + this.blur + 'px #FB4EF8';
    this.elem.style.opacity = this.opacity;
  };

})();

/*================================================

Snake Entity

================================================*/

(function(){ 'use strict';

  g.Snake = function( opt ) {
    this.parentState = opt.parentState;
    this.dir = 'e',
    this.currDir = this.dir;
    this.tiles = [];
    for( var i = 0; i < 5; i++ ) {
      this.tiles.push( new g.SnakeTile({
        parentState: this.parentState,
        parentGroup: this.tiles,
        col: 8 - i,
        row: 3,
        x: ( 8 - i ) * opt.parentState.tileWidth,
        y: 3 * opt.parentState.tileHeight,
        w: opt.parentState.tileWidth - opt.parentState.spacing,
        h: opt.parentState.tileHeight - opt.parentState.spacing
      }));
    }
    this.last = 0;
    this.updateTick = 10;
    this.updateTickMax = this.updateTick;
    this.updateTickLimit = 3;
    this.updateTickChange = 0.2;
    this.deathFlag = 0;
    this.justAteTick = 0;
    this.justAteTickMax = 1;
    this.justAteTickChange = 0.05;

    var i = this.tiles.length;

    while( i-- ) {
      this.parentState.grid.set( this.tiles[ i ].col, this.tiles[ i ].row, 'snake' );
    }
  };

  g.Snake.prototype.updateDimensions = function() {
    var i = this.tiles.length;
    while( i-- ) {
      this.tiles[ i ].updateDimensions();
    }
  };

  g.Snake.prototype.update = function() {
    if( this.parentState.keys.up ) {
      if( this.dir != 's' && this.dir != 'n' && this.currDir != 's' && this.currDir != 'n' ) {
        this.dir = 'n';
      }
    } else if( this.parentState.keys.down) {
      if( this.dir != 'n' && this.dir != 's' && this.currDir != 'n' && this.currDir != 's' ) {
        this.dir = 's';
      }
    } else if( this.parentState.keys.right ) {
      if( this.dir != 'w' && this.dir != 'e' && this.currDir != 'w' && this.currDir != 'e' ) {
        this.dir = 'e';
      }
    } else if( this.parentState.keys.left ) {
      if( this.dir != 'e' && this.dir != 'w' && this.currDir != 'e' && this.currDir != 'w' ) {
        this.dir = 'w';
      }
    }

    this.parentState.keys.up = 0;
    this.parentState.keys.down = 0;
    this.parentState.keys.right = 0;
    this.parentState.keys.left = 0;

    this.updateTick += this.parentState.time.ndelta;
    if( this.updateTick >= this.updateTickMax ) {
      this.updateTick = ( this.updateTick - this.updateTickMax );

      this.tiles.unshift( new g.SnakeTile({
        parentState: this.parentState,
        parentGroup: this.tiles,
        col: this.tiles[ 0 ].col,
        row: this.tiles[ 0 ].row,
        x: this.tiles[ 0 ].col * this.parentState.tileWidth,
        y: this.tiles[ 0 ].row * this.parentState.tileHeight,
        w: this.parentState.tileWidth - this.parentState.spacing,
        h: this.parentState.tileHeight - this.parentState.spacing
      }));
      this.last = this.tiles.pop();
      this.parentState.stageElem.removeChild( this.last.elem );

      this.parentState.boardTiles.collection[ this.last.col + ( this.last.row * this.parentState.cols ) ].classes.pressed = 2;

      var i = this.tiles.length;

      while( i-- ) {
        this.parentState.grid.set( this.tiles[ i ].col, this.tiles[ i ].row, 'snake' );
      }
      this.parentState.grid.set( this.last.col, this.last.row, 'empty' );

      if ( this.dir == 'n' ) {
        this.currDir = 'n';
        this.tiles[ 0 ].row -= 1;
      } else if( this.dir == 's' ) {
        this.currDir = 's';
        this.tiles[ 0 ].row += 1;
      } else if( this.dir == 'w' ) {
        this.currDir = 'w';
        this.tiles[ 0 ].col -= 1;
      } else if( this.dir == 'e' ) {
        this.currDir = 'e';
        this.tiles[ 0 ].col += 1;
      }

      this.wallFlag = false;
      if( this.tiles[ 0 ].col >= this.parentState.cols ) {
        this.tiles[ 0 ].col = 0;
        this.wallFlag = true;
      }
      if( this.tiles[ 0 ].col < 0 ) {
        this.tiles[ 0 ].col = this.parentState.cols - 1;
        this.wallFlag = true;
      }
      if( this.tiles[ 0 ].row >= this.parentState.rows ) {
        this.tiles[ 0 ].row = 0;
        this.wallFlag = true;
      }
      if( this.tiles[ 0 ].row < 0 ) {
        this.tiles[ 0 ].row = this.parentState.rows - 1;
        this.wallFlag = true;
      }

      if( this.parentState.grid.get( this.tiles[ 0 ].col, this.tiles[ 0 ].row ) == 'snake' ) {
        this.deathFlag = 1;
        clearTimeout( this.foodCreateTimeout );
      }

      if( this.parentState.grid.get( this.tiles[ 0 ].col, this.tiles[ 0 ].row ) == 'food' ) {
        this.tiles.push( new g.SnakeTile({
          parentState: this.parentState,
          parentGroup: this.tiles,
          col: this.last.col,
          row: this.last.row,
          x: this.last.col * this.parentState.tileWidth,
          y: this.last.row * this.parentState.tileHeight,
          w: this.parentState.tileWidth - this.parentState.spacing,
          h: this.parentState.tileHeight - this.parentState.spacing
        }));
        if( this.updateTickMax - this.updateTickChange > this.updateTickLimit ) {
          this.updateTickMax -= this.updateTickChange;
        }
        this.parentState.score++;
        this.parentState.scoreElem.innerHTML = this.parentState.score;
        this.justAteTick = this.justAteTickMax;

        this.parentState.food.eaten = 1;
        this.parentState.stageElem.removeChild( this.parentState.food.tile.elem );

        var _this = this;

        this.foodCreateTimeout = setTimeout( function() {
          _this.parentState.food = new g.Food({
            parentState: _this.parentState
          });
        }, 300);
      }

      if( this.deathFlag ) {
        g.setState( 'play' );
      }
    }

    var i = this.tiles.length;
    while( i-- ) {
      this.tiles[ i ].update( i );
    }

    if( this.justAteTick > 0 ) {
      this.justAteTick -= this.justAteTickChange;
    } else if( this.justAteTick < 0 ) {
      this.justAteTick = 0;
    }
  };

  g.Snake.prototype.render = function() {
    var i = this.tiles.length;
    while( i-- ) {
      this.tiles[ i ].render( i );
    }
  };

})();

/*================================================

Food Entity

================================================*/

(function(){ 'use strict';

  g.Food = function( opt ) {
    this.parentState = opt.parentState;
    this.tile = new g.FoodTile({
      parentState: this.parentState,
      col: 0,
      row: 0,
      x: 0,
      y: 0,
      w: opt.parentState.tileWidth - opt.parentState.spacing,
      h: opt.parentState.tileHeight - opt.parentState.spacing
    });
    this.reset();
    this.eaten = 0;
    this.birthTick = 1;
    this.deathTick = 0;
    this.birthTickChange = 0.025;
    this.deathTickChange = 0.05;
  };

  g.Food.prototype.reset = function() {
    var empty = [];
    for( var x = 0; x < this.parentState.cols; x++) {
      for( var y = 0; y < this.parentState.rows; y++) {
        var tile = this.parentState.grid.get( x, y );
        if( tile == 'empty' ) {
          empty.push( { x: x, y: y } );
        }
      }
    }
    var newTile = empty[ g.util.randInt( 0, empty.length - 1 ) ];
    this.tile.col = newTile.x;
    this.tile.row = newTile.y;
  };

  g.Food.prototype.updateDimensions = function() {
    this.tile.updateDimensions();
  };

  g.Food.prototype.update = function() {
    this.tile.update();

    if( this.birthTick > 0 ) {
      this.birthTick -= this.birthTickChange;
    } else if( this.birthTick < 0 ) {
      this.birthTick = 0;
    }

    this.parentState.grid.set( this.tile.col, this.tile.row, 'food' );
  };

  g.Food.prototype.render = function() {
    this.tile.render();
  };

})();

/*================================================

Play State

================================================*/

(function(){ 'use strict';

  function StatePlay() {
    this.name = 'play';
  }

  StatePlay.prototype.init = function() {
    this.scoreElem = document.querySelector( '.score' );
    this.stageElem = document.querySelector( '.stage' );
    // 0 вместо исходных 0.25 — поле должно занимать весь экран,
    // а не 75% от него
    this.padding = 0;
    this.boardTiles = new g.Group();
    this.keys = {};
    this.foodCreateTimeout = null;
    this.score = 0;
    this.scoreElem.innerHTML = this.score;
    this.time = new g.Time();
    this.spacing = 1;
    // cols/rows начинаем с 0 — resize() увидит, что сетки ещё нет,
    // и сам соберёт поле под текущий размер экрана
    this.cols = 0;
    this.rows = 0;
    this.resize();
    this.bindEvents();
  };

  // Целевой размер клетки в пикселях — на узких экранах клетки крупнее
  // (проще целиться пальцем и свайпать), на широких — мельче (больше
  // "игрового пространства" на десктопе)
  StatePlay.prototype.getCellTarget = function() {
    var w = this.winWidth;
    if( w < 480 ) return 24;
    if( w < 900 ) return 28;
    return 34;
  };

  StatePlay.prototype.getDimensions = function() {
    this.winWidth = window.innerWidth;
    this.winHeight = window.innerHeight;
    this.activeWidth = this.winWidth - ( this.winWidth * this.padding );
    this.activeHeight = this.winHeight - ( this.winHeight * this.padding );
  };

  // Полностью пересобирает сетку/змейку/еду под новое число колонок
  // и рядов. Вызывается из resize(), когда меняется не просто размер
  // экрана в пикселях, а именно то, сколько клеток в него помещается
  // (например, поворот телефона или сильное изменение окна).
  StatePlay.prototype.buildRound = function() {
    this.stageElem.innerHTML = '';
    this.boardTiles.empty();
    this.grid = new g.Grid( this.cols, this.rows );
    this.createBoardTiles();
    this.snake = new g.Snake({
      parentState: this
    });
    this.food = new g.Food({
      parentState: this
    });
  };

  StatePlay.prototype.resize = function() {
    var _this = g.currentState();

    _this.getDimensions();

    // Поле теперь всегда во всю ширину и высоту экрана (full-bleed),
    // без сохранения фиксированного соотношения сторон и без чёрных
    // полей по краям — раньше stage вписывался в 16:28 с леттербоксингом.
    _this.stageWidth = _this.activeWidth;
    _this.stageHeight = _this.activeHeight;
    _this.stageElem.style.width = _this.stageWidth + 'px';
    _this.stageElem.style.height = _this.stageHeight + 'px';

    var cellTarget = _this.getCellTarget();
    // минимум 12 — змейка стартует на колонке 8 (см. Snake constructor),
    // сетке нужен запас, чтобы это гарантированно оставалось в границах
    var newCols = Math.max( 12, Math.round( _this.activeWidth / cellTarget ) );
    var newRows = Math.max( 12, Math.round( _this.activeHeight / cellTarget ) );

    _this.dimAvg = ( _this.activeWidth + _this.activeHeight ) / 2;
    _this.spacing = Math.max( 1, ~~( _this.dimAvg * 0.0025 ) );

    if( newCols !== _this.cols || newRows !== _this.rows ) {
      // Число клеток изменилось (например, повернули телефон) — змею
      // безопасно перенести на новую сетку нельзя, поэтому раунд
      // просто начинается заново на пересчитанном поле
      _this.cols = newCols;
      _this.rows = newRows;
      _this.tileWidth = _this.stageWidth / _this.cols;
      _this.tileHeight = _this.stageHeight / _this.rows;
      _this.buildRound();
    } else {
      // Тот же размер сетки — просто пересчитываем пиксельную геометрию
      _this.tileWidth = _this.stageWidth / _this.cols;
      _this.tileHeight = _this.stageHeight / _this.rows;
      _this.boardTiles.each( 'updateDimensions' );
      _this.snake !== undefined && _this.snake.updateDimensions();
      _this.food !== undefined && _this.food.updateDimensions();
    }
  };

  StatePlay.prototype.createBoardTiles = function() {
    for( var y = 0; y < this.rows; y++ ) {
      for( var x = 0; x < this.cols; x++ ) {
        this.boardTiles.add( new g.BoardTile({
          parentState: this,
          parentGroup: this.boardTiles,
          col: x,
          row: y,
          x: x * this.tileWidth,
          y: y * this.tileHeight,
          w: this.tileWidth - this.spacing,
          h: this.tileHeight - this.spacing
        }));
      }
    }
  };

  StatePlay.prototype.upOn = function() { g.currentState().keys.up = 1; }
  StatePlay.prototype.downOn = function() { g.currentState().keys.down = 1; }
  StatePlay.prototype.rightOn = function() { g.currentState().keys.right = 1; }
  StatePlay.prototype.leftOn = function() { g.currentState().keys.left = 1; }
  StatePlay.prototype.upOff = function() { g.currentState().keys.up = 0; }
  StatePlay.prototype.downOff = function() { g.currentState().keys.down = 0; }
  StatePlay.prototype.rightOff = function() { g.currentState().keys.right = 0; }
  StatePlay.prototype.leftOff = function() { g.currentState().keys.left = 0; }

  StatePlay.prototype.keydown = function( e ) {
    e.preventDefault();
    var e = ( e.keyCode ? e.keyCode : e.which ),
      _this = g.currentState();
    if( e === 38 || e === 87 ) { _this.upOn(); }
    if( e === 39 || e === 68 ) { _this.rightOn(); }
    if( e === 40 || e === 83 ) { _this.downOn(); }
    if( e === 37 || e === 65 ) { _this.leftOn(); }
  };

  StatePlay.prototype.bindEvents = function() {
    var _this = g.currentState();
    window.addEventListener( 'keydown', _this.keydown, false );
    window.addEventListener( 'resize', _this.resize, false );
  };

  StatePlay.prototype.step = function() {
    this.boardTiles.each( 'update' );
    this.boardTiles.each( 'render' );
    this.snake.update();
    this.snake.render();
    this.food.update();
    this.food.render();
    this.time.update();
  };

  StatePlay.prototype.exit = function() {
    window.removeEventListener( 'keydown', this.keydown, false );
    window.removeEventListener( 'resize', this.resize, false );
    this.stageElem.innerHTML = '';
    this.grid.tiles = null;
    this.time = null;
  };

  g.addState( new StatePlay() );

})();

/*================================================

Mobile D-pad — использует уже существующие в StatePlay методы
upOn/downOn/leftOn/rightOn (в оригинальном пене объявлены, но нигде
не были подключены — судя по всему, задел под тач-управление).

================================================*/

(function(){ 'use strict';

  function bindDpad() {
    var pad = document.getElementById( 'gamePad' );
    if( !pad ) return;
    var map = {
      up: [ 'upOn', 'upOff' ],
      down: [ 'downOn', 'downOff' ],
      left: [ 'leftOn', 'leftOff' ],
      right: [ 'rightOn', 'rightOff' ]
    };
    var btns = pad.querySelectorAll( '[data-dir]' );
    for( var i = 0; i < btns.length; i++ ) {
      (function( btn ) {
        var dir = btn.getAttribute( 'data-dir' );
        var onName = map[ dir ][ 0 ];
        var offName = map[ dir ][ 1 ];
        var press = function( e ) {
          e.preventDefault();
          g.currentState()[ onName ]();
        };
        var release = function() {
          g.currentState()[ offName ]();
        };
        btn.addEventListener( 'pointerdown', press );
        btn.addEventListener( 'pointerup', release );
        btn.addEventListener( 'pointerleave', release );
        btn.addEventListener( 'pointercancel', release );
      })( btns[ i ] );
    }
  }

  function bindSwipe() {
    var stage = document.querySelector( '.stage' );
    if( !stage ) return;
    var startX = 0, startY = 0, active = false;
    var THRESHOLD = 24;
    stage.addEventListener( 'touchstart', function( e ) {
      if( e.touches.length !== 1 ) return;
      active = true;
      startX = e.touches[ 0 ].clientX;
      startY = e.touches[ 0 ].clientY;
    }, { passive: true } );
    stage.addEventListener( 'touchend', function( e ) {
      if( !active ) return;
      active = false;
      var t = e.changedTouches[ 0 ];
      var dx = t.clientX - startX;
      var dy = t.clientY - startY;
      if( Math.max( Math.abs( dx ), Math.abs( dy ) ) < THRESHOLD ) return;
      var _this = g.currentState();
      if( Math.abs( dx ) > Math.abs( dy ) ) {
        if( dx > 0 ) { _this.rightOn(); } else { _this.leftOn(); }
      } else {
        if( dy > 0 ) { _this.downOn(); } else { _this.upOn(); }
      }
    }, { passive: true } );
  }

  window.addEventListener( 'load', function() {
    bindDpad();
    bindSwipe();
  });

})();

/*================================================

Game

================================================*/

(function(){ 'use strict';

  g.config = {
    title: 'Snakely',
    debug: window.location.hash == '#debug' ? 1 : 0,
    state: 'play'
  };

  g.setState( g.config.state );

  g.time = new g.Time();

  g.step = function() {
    requestAnimationFrame( g.step );
    g.states[ g.state ].step();
    g.time.update();
  };

  window.addEventListener( 'load', g.step, false );

})();
