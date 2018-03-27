import { message } from 'antd';
import autobind from 'autobind-decorator';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import GenericFormContainer from 'normandy/components/recipes/GenericFormContainer';
import handleError from 'normandy/utils/handleError';
import ExtensionForm from 'normandy/components/extensions/ExtensionForm';
import {
  createExtension as createExtensionAction,
} from 'normandy/state/app/extensions/actions';
import { NormandyLink } from '../../Router';


@withRouter
@connect(
  null,
  {
    createExtension: createExtensionAction,
  },
)
@autobind
export default class CreateExtensionPage extends React.PureComponent {
  static propTypes = {
    createExtension: PropTypes.func.isRequired,
    history: PropTypes.object.isRequired,
  }

  onFormSuccess(extensionId) {
    message.success('Extension saved');
    this.props.history.push(`${NormandyLink.PREFIX}/extension/${extensionId}/`);
  }

  onFormFailure(err) {
    handleError('Extension cannot be saved.', err);
  }

  async formAction(values) {
    const { createExtension } = this.props;
    return createExtension(values);
  }

  render() {
    return (
      <div>
        <h2>Add New Extension</h2>
        <GenericFormContainer
          form={ExtensionForm}
          formAction={this.formAction}
          onSuccess={this.onFormSuccess}
          onFailure={this.onFormFailure}
        />
      </div>
    );
  }
}
