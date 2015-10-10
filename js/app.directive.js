// Directives

app.directive('input', function() {
    return {
        restrict: 'E',
        require: '?ngModel',
        link: function(scope, elm, attr, ctrl) {
            if (!ctrl) {
                return;
            }
            
            elm.bind('focus', function () {
                elm.addClass('has-focus');

                scope.$apply(function () {
                    ctrl.hasFocus = true;
                });
            });

            elm.bind('blur', function () {
                elm.removeClass('has-focus');
                elm.addClass('has-visited');

                scope.$apply(function () {
                    ctrl.hasFocus = false;
                    ctrl.hasVisited = true;
                });
            });
           
            if (attr.type == 'text' && attr.ngPattern === '/[0-9]/') {
                elm.bind('keyup',function (){
                    var text = this.value;
                    console.log(text);
                    this.value = text.replace(/[a-zA-Z]/g,'');
                });
            }  
        }
    };
});









