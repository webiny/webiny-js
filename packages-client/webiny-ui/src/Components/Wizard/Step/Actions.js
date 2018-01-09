import React from 'react';
import {Webiny} from 'webiny-client';

import Next from './Actions/Next';
import Previous from './Actions/Previous';
import Action from './Actions/Action';
import Finish from './Actions/Finish';

class Actions extends Webiny.Ui.Component {
}

Actions.Next = Next;
Actions.Previous = Previous;
Actions.Action = Action;
Actions.Finish = Finish;

export default Actions;