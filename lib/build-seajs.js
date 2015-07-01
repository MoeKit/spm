require('gnode');
var join = require('path').join;
var exists = require('fs').existsSync;
var readFile = require('fs').readFileSync;
var Build = require('spm-sea/lib').Build;
var hook = require('scripts-hook');
var log = require('spm-log');
var cwd = join(process.cwd(), '');
var file = join(cwd, 'package.json');
var pkg = exists(file) && JSON.parse(readFile(file, 'utf-8')) || {};
var entry = [];

exports.build = function(dir, fn) {
  var info = '';
  if (entry.length) {
    info = 'build ' + entry.join(',');
  } else if (!pkg || !pkg.spm) {
    console.log();
    log.error('miss', 'package.json or "spm" key');
    console.log();
    process.exit(1);
  } else {
    var pkgId = pkg.name && pkg.version && (pkg.name + '@' + pkg.version) || '';
    info = ('build ' + pkgId).to.magenta.color;
  }

  var begin = Date.now();
  console.log();
  log.info('start', info);
  var program = {};

  var args = {
    dest: dir,
    cwd: cwd,
    outputFile: program.outputFile,

    include: program.include,
    ignore: program.ignore,
    global: program.global,
    skip: program.skip,
    idleading: program.idleading,
    registry: program.registry || (pkg.spm && pkg.spm.registry),

    withDeps: program.withDeps,
    zip: program.zip,
    force: program.force,
    install: program.install,

    originPkg: pkg,
    entry: entry
  };

  var scripts = pkg && pkg.spm && pkg.spm.scripts || {};
  hook(scripts, 'build', function(done) {
    new Build(args)
      .getArgs()
      .installDeps()
      .parsePkg()
      .addCleanTask()
      .run(function(err) {
        if (err) {
          log.error(err.message);
          log.error(err.stack);
          process.exit(1);
        }

        done();
      });
  }).then(function() {
    log.info('finish', info + showDiff(begin));
    console.log();
    fn && fn();
  }, function() {});
};

function showDiff(time) {
  var diff = Date.now() - time;
  return (' (' + diff + 'ms)').to.gray.color;
}